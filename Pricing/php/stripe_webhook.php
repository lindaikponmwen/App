<?php
require_once 'config.php';

$logFile = 'webhook_debug.log';

function logWebhook($message) {
    global $logFile;
    $date = date('Y-m-d H:i:s');
    @file_put_contents($logFile, "[SDK] [$date] $message" . PHP_EOL, FILE_APPEND);
}

// Capture payload & signature
$payload = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

if (!$payload || !$sigHeader) {
    logWebhook("ERROR 400: Missing payload or signature.");
    http_response_code(400);
    exit;
}

try {
    $event = \Stripe\Webhook::constructEvent(
        $payload,
        $sigHeader,
        STRIPE_WEBHOOK_SECRET
    );

    $eventId = $event->id;
    $type = $event->type;

    $db = getDB();

    // Idempotency check - Removed explicit COLLATE to prevent mismatch errors
    $stmt = $db->prepare("SELECT 1 FROM processed_webhooks WHERE event_id = ? LIMIT 1");
    $stmt->execute([$eventId]);
    if ($stmt->fetch()) {
        logWebhook("INFO: Event $eventId already processed.");
        http_response_code(200);
        exit;
    }
    $db->prepare("INSERT INTO processed_webhooks (event_id) VALUES (?)")->execute([$eventId]);

    logWebhook("VERIFIED: Received $type (ID: $eventId)");

    // Log event to subscription_events for audit trail
    try {
        $db->prepare("INSERT INTO subscription_events (event_type, payload) VALUES (?, ?)")
           ->execute([$type, $payload]);
    } catch (Exception $e) {
        logWebhook("DB ERROR (Audit Log): " . $e->getMessage());
    }

    switch ($type) {
        case 'checkout.session.completed':
            $obj = $event->data->object;
            $sessionId = $obj->id;
            
            // Mark recovery record as completed
            try {
                $db->prepare("UPDATE checkout_recovery SET status = 'completed' WHERE stripe_checkout_id = ?")
                   ->execute([$sessionId]);
                logWebhook("RECOVERY: Marked session $sessionId as COMPLETED.");
            } catch (Exception $e) {
                logWebhook("RECOVERY ERROR: " . $e->getMessage());
            }
            // Fall through to existing logic
        case 'customer.subscription.created':
            $obj = $event->data->object;
            
            // Check for incomplete subscription (3D Secure failure/abandonment)
            if ($type === 'customer.subscription.created' && ($obj->status ?? '') === 'incomplete') {
                $subId = $obj->id;
                $userId = $obj->metadata->user_id ?? null;
                
                if ($userId) {
                    try {
                        $db->prepare("UPDATE checkout_recovery SET status = 'incomplete', stripe_subscription_id = ? WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1")
                           ->execute([$subId, $userId]);
                        logWebhook("RECOVERY: Marked User $userId as INCOMPLETE for sub $subId.");
                    } catch (Exception $e) {
                        logWebhook("RECOVERY ERROR (Incomplete): " . $e->getMessage());
                    }
                }
            }
            // Fall through to existing logic
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            $obj = $event->data->object;
            $subId = ($type === 'checkout.session.completed') ? ($obj->subscription ?? null) : ($obj->id ?? null);
            $cusId = $obj->customer ?? null;
            $userEmail = $obj->customer_details->email ?? $obj->email ?? null;
            $userId = $obj->client_reference_id ?? null;

            if (!$subId) break;

            $isTransferredSubEvent = false;

            // 🔎 1. Find the User
            if (!$userId && $cusId) {
                $stmt = $db->prepare("SELECT id FROM users WHERE stripe_customer_id = ? LIMIT 1");
                $stmt->execute([$cusId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($user) $userId = $user['id'];
            }
            
            if (!$userId && $userEmail) {
                $stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
                $stmt->execute([$userEmail]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($user) $userId = $user['id'];
            }

            if (!$userId && $subId) {
                $stmt = $db->prepare("SELECT owner_id FROM teams WHERE stripe_subscription_id = ? LIMIT 1");
                $stmt->execute([$subId]);
                $team = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($team) {
                    $userId = $team['owner_id'];
                    $isTransferredSubEvent = true;
                    logWebhook("INFO: Found team owner $userId via transferred subscription $subId");
                }
            }

            if (!$userId) {
                logWebhook("WARNING: Could not link event $type to a user. Cus: $cusId | Email: $userEmail");
                break;
            }

            // 📞 2. Fetch Source of Truth from Stripe
            try {
                $subscription = \Stripe\Subscription::retrieve($subId);
                $status = $subscription->status;
                
                // 🛡️ DOUBLE-INSURED CANCELLATION CHECK
                $isCanceling = (
                    (!empty($subscription['cancel_at_period_end'])) || 
                    (!empty($subscription['cancel_at'])) ||
                    (!empty($subscription['cancellation_details']['reason']))
                );

                $cancelAtEnd = ($isCanceling && $status !== 'canceled') ? 1 : 0;
                
                // 📅 Determine the correct dates
                // Use current_period_start to reflect the start of the CURRENT paid window
                $rawStart = 0;
                if (isset($subscription->current_period_start)) $rawStart = $subscription->current_period_start;
                else if (isset($subscription['current_period_start'])) $rawStart = $subscription['current_period_start'];
                else if (isset($subscription->start_date)) $rawStart = $subscription->start_date;
                
                $startDate = $rawStart ? date('Y-m-d H:i:s', (int)$rawStart) : null;
                
                // Use current_period_end as the deadline. 
                // If payment failed, this is the date they "ran out" of paid time.
                $rawEnd = 0;
                if (isset($subscription->current_period_end)) $rawEnd = $subscription->current_period_end;
                else if (isset($subscription['current_period_end'])) $rawEnd = $subscription['current_period_end'];
                else if (isset($subscription->cancel_at)) $rawEnd = $subscription->cancel_at;
                else if (isset($subscription->trial_end)) $rawEnd = $subscription->trial_end;
                else if (isset($subscription->ended_at)) $rawEnd = $subscription->ended_at;
                
                // Final fallback: try to get from data.object if it's a direct event object
                if (!$rawEnd && isset($obj->current_period_end)) $rawEnd = $obj->current_period_end;
                if (!$rawEnd && isset($obj->cancel_at)) $rawEnd = $obj->cancel_at;

                $periodEnd = $rawEnd ? date('Y-m-d H:i:s', (int)$rawEnd) : null;
                
                logWebhook("DEBUG: User $userId | RawStart: $rawStart | RawEnd: $rawEnd | PeriodEnd: $periodEnd");
                // Log to root for visibility
                @file_put_contents(__DIR__ . '/../webhook_last_debug.log', "User: $userId | Start: $startDate | End: $periodEnd" . PHP_EOL, FILE_APPEND);
                
                // Determine Plan & Status
                // Access Logic: active and past_due users are members.
                $metadata = $subscription->metadata ?? [];
                $isTeam = ($metadata['subscription_type'] ?? '') === 'team';
                
                // Also check line items for the price ID if metadata is missing
                if (!$isTeam && isset($subscription->items->data[0]->price->id)) {
                    $priceId = $subscription->items->data[0]->price->id;
                    logWebhook("DEBUG: Checking Price ID: $priceId against " . (defined('STRIPE_TEAM_PRICE_ID') ? STRIPE_TEAM_PRICE_ID : 'UNDEFINED'));
                    if (defined('STRIPE_TEAM_PRICE_ID') && $priceId === STRIPE_TEAM_PRICE_ID) {
                        $isTeam = true;
                    }
                }

                if ($isTeam) {
                    logWebhook("DEBUG: Subscription $subId identified as TEAM");
                }

                $plan = in_array($status, ['active', 'past_due']) ? ($isTeam ? 'team' : 'pro') : 'free';
                $dbStatus = $status; // Mirror Stripe status exactly
                
                // 🛡️ Grace Period Status Override:
                // If Stripe says it's active but it's canceling, preserve the grace period status
                if (in_array($status, ['active', 'past_due'])) {
                    if ($isTransferredSubEvent) {
                        $dbStatus = 'transferred';
                    } else if ($isCanceling) {
                        $dbStatus = 'canceling';
                    }
                }

                // Get quantity (seats)
                $seats = 1;
                if (isset($subscription->items->data[0]->quantity)) {
                    $seats = (int)$subscription->items->data[0]->quantity;
                }

                // 🔄 Recently Canceled & Net Payment Logic:
                // recently_canceled is ONLY 1 when the subscription is fully dead. Grace periods stay 0.
                $recentlyCanceled = 0;
                
                if (in_array($status, ['canceled', 'unpaid'])) {
                    $recentlyCanceled = 1;
                    
                    // We still check history via Stripe API to see if they are a "First-Timer" 
                    // to determine if we should reset their status to 'none'
                    try {
                        $stripeClient = new \Stripe\StripeClient(STRIPE_SECRET_KEY);
                        $charges = $stripeClient->charges->all([
                            'customer' => $cusId,
                            'limit' => 10
                        ]);
                        
                        $netSuccessfulPayments = 0;
                        foreach ($charges->data as $c) {
                            if ($c->paid && !$c->refunded && $c->amount_refunded == 0) {
                                $netSuccessfulPayments++;
                            }
                        }
                        
                        $isVeteran = ($netSuccessfulPayments > 0);
                        
                        // If they are a first-timer (Net = 0) and they are canceled, reset status to 'none'
                        if (!$isVeteran && $status === 'canceled') {
                            $dbStatus = 'none';
                        }
                        
                        logWebhook("STRIPE API (Net Check): Found $netSuccessfulPayments net successful payments. Veteran: " . ($isVeteran ? 'Yes' : 'No'));
                    } catch (Exception $e) {
                        logWebhook("STRIPE API ERROR (Net Check): " . $e->getMessage());
                    }
                } else if (in_array($status, ['active', 'past_due'])) {
                    $recentlyCanceled = 0;
                }

                // 🛑 Cancel At Period End Logic:
                $cancelAtEnd = ($isCanceling && in_array($status, ['active', 'past_due'])) ? 1 : 0;

                // 🛑 Safety Date Logic:
                $dbEndsAt = $periodEnd;
                
                // If we have a team subscription, we MUST have an end date for the grace period
                if ($isTeam && !$dbEndsAt) {
                    // Try to fetch the latest subscription data one more time
                    try {
                        $stripeClient = new \Stripe\StripeClient(STRIPE_SECRET_KEY);
                        $sub = $stripeClient->subscriptions->retrieve($subId);
                        $rawEnd = $sub->current_period_end ?? $sub->cancel_at ?? $sub->trial_end ?? 0;
                        if ($rawEnd) {
                            $dbEndsAt = date('Y-m-d H:i:s', (int)$rawEnd);
                        }
                    } catch (Exception $e) {
                        error_log("Final fallback fetch failed: " . $e->getMessage());
                    }
                }

                logWebhook("DEBUG: User $userId | Status: $status | Plan: $plan | Seats: $seats");

                // 💾 3. Unified Database Update
                $stmt = $db->prepare("SELECT team_id, team_role, subscription_plan, stripe_customer_id, stripe_subscription_id FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $userTeam = $stmt->fetch(PDO::FETCH_ASSOC);

                $oldPlan = $userTeam['subscription_plan'] ?? 'free';
                $oldSubId = $userTeam['stripe_subscription_id'] ?? null;

                // If this is a team checkout and the user is already a team owner (e.g., from a transfer),
                // we should cancel the old team subscription, not just their individual one (which is likely NULL).
                if ($isTeam && $userTeam && !empty($userTeam['team_id']) && $userTeam['team_role'] === 'owner') {
                    $teamStmt = $db->prepare("SELECT stripe_subscription_id FROM teams WHERE id = ?");
                    $teamStmt->execute([$userTeam['team_id']]);
                    $teamData = $teamStmt->fetch(PDO::FETCH_ASSOC);
                    if ($teamData && !empty($teamData['stripe_subscription_id'])) {
                        $oldSubId = $teamData['stripe_subscription_id'];
                    }
                }

                // 🛑 IMMEDIATE SUBSCRIPTION CANCELLATION LOGIC
                if ($isTeam && $oldSubId && $oldSubId !== $subId) {
                    try {
                        logWebhook("UPGRADE: Canceling old subscription $oldSubId for User $userId");
                        $stripeClient = new \Stripe\StripeClient(STRIPE_SECRET_KEY);
                        
                        // Check if it's already canceled
                        $oldSub = $stripeClient->subscriptions->retrieve($oldSubId);
                        if ($oldSub->status !== 'canceled') {
                            $stripeClient->subscriptions->cancel($oldSubId);
                            logWebhook("SUCCESS: Canceled old subscription $oldSubId");
                        } else {
                            logWebhook("INFO: Old subscription $oldSubId is already canceled, skipping cancellation.");
                        }
                    } catch (Exception $e) {
                        logWebhook("ERROR: Failed to cancel old subscription $oldSubId: " . $e->getMessage());
                        // Stop the process to prevent database update with new sub ID if cancellation fails
                        http_response_code(500);
                        exit;
                    }
                }

                $updateCusId = $isTransferredSubEvent ? $userTeam['stripe_customer_id'] : $cusId;
                $updateSubId = $isTransferredSubEvent ? $userTeam['stripe_subscription_id'] : $subId;

                if (!$userTeam || !$userTeam['team_id'] || $userTeam['team_role'] !== 'owner') {
                    // 🛡️ MEMBER GUARD: Only update status if it's a team event or they aren't in a team.
                    $isInTeam = !empty($userTeam['team_id']);
                    $allowUpdate = true;
                    
                    if ($isInTeam && !$isTeam) {
                        $allowUpdate = false;
                        logWebhook("INFO: Guarded Member $userId from individual event $subId (Plan: $plan). Syncing to Team Status.");
                        // Force sync them back to the team's actual status
                        updateTeamStatus($db, $userTeam['team_id']);
                    }

                    if ($allowUpdate) {
                        $db->prepare("
                            UPDATE users
                            SET subscription_status = ?,
                                subscription_plan = ?,
                                stripe_customer_id = ?,
                                stripe_subscription_id = ?,
                                cancel_at_period_end = ?,
                                subscription_ends_at = ?,
                                recently_canceled = ?,
                                subscription_start_date = ?
                            WHERE id = ?
                        ")->execute([
                            $dbStatus, 
                            $plan, 
                            $updateCusId, 
                            $updateSubId, 
                            $cancelAtEnd, 
                            $dbEndsAt, 
                            $recentlyCanceled, 
                            $startDate,
                            $userId
                        ]);
                    }
                } else {
                    // Only update if it's a team subscription event
                    if ($isTeam) {
                        // 1. Update the team record (Source of Truth)
                        $db->prepare("
                            UPDATE teams
                            SET status = ?,
                                cancel_at_period_end = ?,
                                subscription_ends_at = ?,
                                subscription_start_date = ?,
                                recently_canceled = ?,
                                stripe_customer_id = ?,
                                stripe_subscription_id = ?,
                                total_seats = ?
                            WHERE id = ?
                        ")->execute([
                            $dbStatus,
                            $cancelAtEnd,
                            $dbEndsAt,
                            $startDate,
                            $recentlyCanceled,
                            $cusId,
                            $subId,
                            $seats,
                            $userTeam['team_id']
                        ]);

                        // 2. Update the owner's record with IDs and subscription details
                        $db->prepare("
                            UPDATE users
                            SET stripe_customer_id = ?,
                                stripe_subscription_id = ?,
                                cancel_at_period_end = ?,
                                subscription_ends_at = ?,
                                recently_canceled = ?,
                                subscription_status = ?,
                                subscription_plan = 'team'
                            WHERE id = ?
                        ")->execute([
                            $updateCusId, 
                            $updateSubId, 
                            $cancelAtEnd,
                            $dbEndsAt,
                            $recentlyCanceled,
                            $dbStatus,
                            $userId
                        ]);

                        // 3. Sync all members
                        updateTeamStatus($db, $userTeam['team_id']);
                    } else {
                        // 🛡️ GUARD: If they are a team owner, only update the sub ID if it matches their current one.
                        // This prevents old individual subscriptions (being deleted) from overwriting the new team ID.
                        if ($subId === ($userTeam['stripe_subscription_id'] ?? '')) {
                            $db->prepare("
                                UPDATE users
                                SET stripe_customer_id = ?,
                                    stripe_subscription_id = ?
                                WHERE id = ?
                            ")->execute([
                                $updateCusId, 
                                $updateSubId, 
                                $userId
                            ]);
                        } else {
                            // Just update customer ID if it's missing, but don't touch the subscription ID
                            if (empty($userTeam['stripe_customer_id'])) {
                                $db->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?")
                                   ->execute([$updateCusId, $userId]);
                            }
                            logWebhook("INFO: Guarded Team Owner $userId from overwriting Team Sub with Individual Sub $subId");
                        }
                    }
                }

                // 🏢 4. Team Creation & Status Logic
                if ($isTeam) {
                    // Check if user already has a team record (including deleted)
                    // We prioritize their current team_id if they are the owner
                    $existingTeam = null;
                    if (!empty($userTeam['team_id']) && $userTeam['team_role'] === 'owner') {
                        $stmt = $db->prepare("SELECT id, status FROM teams WHERE id = ? LIMIT 1");
                        $stmt->execute([$userTeam['team_id']]);
                        $existingTeam = $stmt->fetch(PDO::FETCH_ASSOC);
                    }
                    
                    // Fallback: Check if they are owner of ANY team by subscription ID (including deleted)
                    if (!$existingTeam) {
                        $stmt = $db->prepare("SELECT id, status FROM teams WHERE stripe_subscription_id = ? LIMIT 1");
                        $stmt->execute([$subId]);
                        $existingTeam = $stmt->fetch(PDO::FETCH_ASSOC);
                    }

                    // 💀 Death Certificate Check: If the team is deleted, do NOT resurrect it.
                    if ($existingTeam && $existingTeam['status'] === 'deleted') {
                        logWebhook("WEBHOOK: Ignoring event for DELETED team " . $existingTeam['id'] . ". No resurrection allowed.");
                        break;
                    }
                    
                    if (!$existingTeam) {
                        $teamId = createTeam($db, $userId, $cusId, $subId, $seats, 'My Team', $dbEndsAt, $startDate, $cancelAtEnd, $recentlyCanceled, $dbStatus);
                        updateTeamStatus($db, $teamId);
                    } else {
                        // Update existing team with new subscription details
                        $db->prepare("
                            UPDATE teams 
                            SET stripe_customer_id = ?, 
                                stripe_subscription_id = ?,
                                total_seats = ?,
                                status = ?,
                                subscription_ends_at = ?,
                                subscription_start_date = ?,
                                cancel_at_period_end = ?,
                                recently_canceled = ?
                            WHERE id = ?
                        ")->execute([
                            $cusId, 
                            $subId, 
                            $seats, 
                            $dbStatus,
                            $dbEndsAt, 
                            $startDate, 
                            $cancelAtEnd, 
                            $recentlyCanceled, 
                            $existingTeam['id']
                        ]);
                        
                        // Ensure user is linked to this team as owner (in case they weren't or were a member)
                        $db->prepare("UPDATE users SET team_id = ?, team_role = 'owner' WHERE id = ?")
                           ->execute([$existingTeam['id'], $userId]);

                        updateTeamStatus($db, $existingTeam['id']);
                    }
                } else if ($oldPlan === 'team' && $plan === 'pro' && $userTeam && $userTeam['team_id']) {
                    // Team owner switched to Pro, check if team is canceling
                    $stmt = $db->prepare("SELECT status FROM teams WHERE id = ?");
                    $stmt->execute([$userTeam['team_id']]);
                    $team = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($team && $team['status'] === 'canceling') {
                        logWebhook("ALERT: Dissolving Team " . $userTeam['team_id'] . " because owner switched to Pro and team was canceling.");
                        deleteTeam($db, $userTeam['team_id'], false);
                    } else {
                        logWebhook("INFO: Team " . $userTeam['team_id'] . " not dissolved because it was not in 'canceling' state.");
                    }
                }

                logWebhook("SUCCESS: Updated User $userId. Status: $dbStatus | Plan: $plan | CancelAtEnd: $cancelAtEnd");

            } catch (Exception $e) {
                logWebhook("STRIPE ERROR: " . $e->getMessage());
            }
            break;

        case 'checkout.session.expired':
            $obj = $event->data->object;
            $sessionId = $obj->id;
            
            try {
                $db->prepare("UPDATE checkout_recovery SET status = 'expired' WHERE stripe_checkout_id = ?")
                   ->execute([$sessionId]);
                logWebhook("RECOVERY: Marked session $sessionId as EXPIRED.");
            } catch (Exception $e) {
                logWebhook("RECOVERY ERROR (Expired): " . $e->getMessage());
            }
            break;

        case 'invoice.payment_succeeded':
            $invoice = $event->data->object;
            $cusId = $invoice->customer;
            
            logWebhook("INFO: Payment succeeded for Invoice " . $invoice->id . " (Customer: $cusId)");

            // Find user
            $stmt = $db->prepare("SELECT id FROM users WHERE stripe_customer_id = ? LIMIT 1");
            $stmt->execute([$cusId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                $userId = $user['id'];
                // Store invoice details
                try {
                    $db->prepare("
                        INSERT INTO invoices (user_id, stripe_invoice_id, amount_paid, currency, status, hosted_invoice_url, invoice_pdf)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE status = VALUES(status), hosted_invoice_url = VALUES(hosted_invoice_url), invoice_pdf = VALUES(invoice_pdf)
                    ")->execute([
                        $userId,
                        $invoice->id,
                        $invoice->amount_paid,
                        $invoice->currency,
                        $invoice->status,
                        $invoice->hosted_invoice_url,
                        $invoice->invoice_pdf
                    ]);
                    logWebhook("SUCCESS: Logged invoice " . $invoice->id . " for User $userId");

                    // FIX: Also update user subscription status to active on successful payment
                    if (!empty($invoice->subscription)) {
                        $subId = $invoice->subscription;
                        try {
                            $subscription = \Stripe\Subscription::retrieve($subId);
                            $metadata = $subscription->metadata ?? [];
                            $isTeam = ($metadata['subscription_type'] ?? '') === 'team';
                            
                            // Also check price ID if metadata is missing
                            if (!$isTeam && isset($subscription->items->data[0]->price->id)) {
                                $priceId = $subscription->items->data[0]->price->id;
                                logWebhook("DEBUG (Invoice): Checking Price ID: $priceId against " . (defined('STRIPE_TEAM_PRICE_ID') ? STRIPE_TEAM_PRICE_ID : 'UNDEFINED'));
                                if (defined('STRIPE_TEAM_PRICE_ID') && $priceId === STRIPE_TEAM_PRICE_ID) {
                                    $isTeam = true;
                                }
                            }

                            if ($isTeam) {
                                logWebhook("DEBUG (Invoice): Subscription $subId identified as TEAM");
                            }

                            $plan = $isTeam ? 'team' : 'pro';
                            
                            // Repair logic: If it's a team but no team record exists
                            if ($isTeam) {
                                // Check if team already exists (including deleted)
                                $existingTeam = null;
                                
                                // 1. Check by subscription ID
                                $stmt = $db->prepare("SELECT id, status FROM teams WHERE stripe_subscription_id = ? LIMIT 1");
                                $stmt->execute([$subId]);
                                $existingTeam = $stmt->fetch(PDO::FETCH_ASSOC);
                                
                                // 2. Fallback: Check if user is owner of any team (including deleted)
                                if (!$existingTeam) {
                                    $stmt = $db->prepare("SELECT id, status FROM teams WHERE owner_id = ? ORDER BY id DESC LIMIT 1");
                                    $stmt->execute([$userId]);
                                    $existingTeam = $stmt->fetch(PDO::FETCH_ASSOC);
                                }

                                // 💀 Death Certificate Check: If the team is deleted, do NOT repair/resurrect it.
                                if ($existingTeam && $existingTeam['status'] === 'deleted') {
                                    logWebhook("REPAIR: Ignoring invoice for DELETED team " . $existingTeam['id']);
                                    break;
                                }

                                if (!$existingTeam) {
                                    logWebhook("REPAIR: Creating missing team for User $userId via invoice webhook.");
                                    $rawEnd = $subscription->current_period_end ?? 0;
                                    $dbEndsAt = $rawEnd ? date('Y-m-d H:i:s', (int)$rawEnd) : null;
                                    $rawStart = $subscription->current_period_start ?? 0;
                                    $startDate = $rawStart ? date('Y-m-d H:i:s', (int)$rawStart) : null;
                                    $seats = $subscription->items->data[0]->quantity ?? 5;
                                    
                                    $teamId = createTeam($db, $userId, $cusId, $subId, $seats, 'My Team', $dbEndsAt, $startDate, 0, 0, 'active');
                                    updateTeamStatus($db, $teamId);
                                } else {
                                    logWebhook("REPAIR: Updating existing team " . $existingTeam['id'] . " for User $userId via invoice webhook.");
                                    $rawEnd = $subscription->current_period_end ?? 0;
                                    $dbEndsAt = $rawEnd ? date('Y-m-d H:i:s', (int)$rawEnd) : null;
                                    $rawStart = $subscription->current_period_start ?? 0;
                                    $startDate = $rawStart ? date('Y-m-d H:i:s', (int)$rawStart) : null;
                                    $seats = $subscription->items->data[0]->quantity ?? 5;

                                    $db->prepare("
                                        UPDATE teams 
                                        SET status = 'active',
                                            stripe_subscription_id = ?,
                                            stripe_customer_id = ?,
                                            subscription_ends_at = ?,
                                            subscription_start_date = ?,
                                            total_seats = ?
                                        WHERE id = ?
                                    ")->execute([
                                        $subId,
                                        $cusId,
                                        $dbEndsAt,
                                        $startDate,
                                        $seats,
                                        $existingTeam['id']
                                    ]);

                                    // Ensure user is linked
                                    $db->prepare("UPDATE users SET team_id = ?, team_role = 'owner' WHERE id = ?")
                                       ->execute([$existingTeam['id'], $userId]);

                                    updateTeamStatus($db, $existingTeam['id']);
                                }
                            }

                            $db->prepare("UPDATE users SET subscription_status = 'active', subscription_plan = ?, stripe_subscription_id = ? WHERE id = ?")
                               ->execute([$plan, $subId, $userId]);
                            logWebhook("SUCCESS: Updated User $userId status to active ($plan) via invoice webhook.");
                        } catch (Exception $e) {
                            logWebhook("ERROR (Invoice Sub Sync): " . $e->getMessage());
                        }
                    }
                } catch (Exception $e) {
                    logWebhook("DB ERROR (Invoices/Status): " . $e->getMessage());
                }
            }
            break;

        case 'invoice.payment_failed':
            $invoice = $event->data->object;
            logWebhook("WARNING: Payment failed for Invoice " . $invoice->id . " (Customer: " . $invoice->customer . ")");
            // Subscription status will eventually hit past_due/unpaid via subscription.updated
            break;

        case 'charge.refunded':
            $charge = $event->data->object;
            $cusId = $charge->customer;
            logWebhook("ALERT: Charge refunded for Customer $cusId. Money returned, but access remains until manually canceled.");
            break;

        default:
            logWebhook("INFO: Event type $type acknowledged but not handled.");
            break;
    }

    http_response_code(200);

} catch (\UnexpectedValueException $e) {
    logWebhook("ERROR 400: Invalid payload " . $e->getMessage());
    http_response_code(400);
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    logWebhook("ERROR 400: Signature mismatch " . $e->getMessage());
    http_response_code(400);
} catch (Exception $e) {
    logWebhook("ERROR 500: " . $e->getMessage());
    http_response_code(500);
}
?>