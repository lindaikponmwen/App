<?php
/**
 * Projects Database Seeding Script
 *
 * Seeds the database with demo projects for testing
 */

require_once __DIR__ . '/../config/database.php';

try {
    $db = getDatabase();

    echo "Seeding projects database...\n\n";

    // Demo projects data
    $projects = [
        [
            'title' => 'Phase I Drug Absorption Study',
            'description' => 'Comprehensive two-compartment pharmacokinetic model analysis investigating drug absorption kinetics in healthy volunteers. This study evaluates bioavailability, clearance, and volume of distribution parameters.',
            'status' => 'active',
            'start_date' => '2025-01-01',
            'end_date' => null,
            'created_by' => 1,
            'members' => [1, 2, 3],
            'keywords' => ['pharmacokinetics', 'bioavailability', 'two-compartment model', 'drug absorption', 'clearance', 'volume of distribution'],
            'analysis_types' => ['Non-compartmental Analysis', 'Population PK', 'Bioequivalence', 'Safety Analysis']
        ],
        [
            'title' => 'Bioequivalence Analysis',
            'description' => 'Statistical comparison of pharmacokinetic parameters between test and reference formulations to establish therapeutic equivalence. Includes crossover study design and regulatory compliance analysis.',
            'status' => 'completed',
            'start_date' => '2024-12-15',
            'end_date' => '2025-01-10',
            'created_by' => 1,
            'members' => [1, 2],
            'keywords' => ['bioequivalence', 'crossover design', 'AUC', 'Cmax', 'regulatory compliance', 'generic drugs'],
            'analysis_types' => ['Bioequivalence', 'Statistical Analysis', 'Regulatory Submission']
        ],
        [
            'title' => 'Population PK Modeling',
            'description' => 'Advanced population pharmacokinetic modeling incorporating patient covariates such as age, weight, renal function, and genetic polymorphisms to optimize dosing strategies.',
            'status' => 'paused',
            'start_date' => '2024-12-20',
            'end_date' => null,
            'created_by' => 1,
            'members' => [1, 3],
            'keywords' => ['population PK', 'covariates', 'NONMEM', 'dosing optimization', 'genetic polymorphisms', 'renal function'],
            'analysis_types' => ['Population PK', 'Covariate Analysis', 'Dosing Simulation', 'Model Validation']
        ],
        [
            'title' => 'System Integration & Data Management',
            'description' => 'Implementation of advanced data management systems for clinical research operations. Focus on data integrity, security protocols, and regulatory compliance frameworks.',
            'status' => 'active',
            'start_date' => '2024-11-15',
            'end_date' => null,
            'created_by' => 2,
            'members' => [2, 1],
            'keywords' => ['data management', 'system integration', 'security', 'compliance', 'database', 'automation'],
            'analysis_types' => ['Statistical Analysis', 'Model Validation', 'Regulatory Submission']
        ],
        [
            'title' => 'Regulatory Compliance Audit',
            'description' => 'Comprehensive audit of all research processes to ensure compliance with FDA, EMA, and ICH guidelines. Implementation of quality assurance protocols.',
            'status' => 'completed',
            'start_date' => '2024-10-01',
            'end_date' => '2024-12-31',
            'created_by' => 2,
            'members' => [2, 1, 3],
            'keywords' => ['regulatory compliance', 'FDA', 'EMA', 'ICH', 'quality assurance', 'audit'],
            'analysis_types' => ['Regulatory Submission', 'Statistical Analysis']
        ],
        [
            'title' => 'Clinical Data Analysis Support',
            'description' => 'Supporting role in clinical data analysis and statistical modeling. Focus on data validation, preliminary analysis, and report generation for ongoing studies.',
            'status' => 'active',
            'start_date' => '2024-12-01',
            'end_date' => null,
            'created_by' => 3,
            'members' => [3, 1],
            'keywords' => ['data analysis', 'statistical modeling', 'data validation', 'clinical support', 'reporting'],
            'analysis_types' => ['Statistical Analysis', 'Safety Analysis']
        ],
        [
            'title' => 'Pediatric Dosing Optimization',
            'description' => 'Development of age-appropriate dosing regimens for pediatric patients using allometric scaling and maturation models. Investigation of physiological changes affecting drug disposition in children.',
            'status' => 'active',
            'start_date' => '2025-01-15',
            'end_date' => null,
            'created_by' => 1,
            'members' => [1, 2, 3],
            'keywords' => ['pediatric', 'dosing', 'allometric scaling', 'maturation models', 'age-appropriate', 'pharmacokinetics'],
            'analysis_types' => ['Population PK', 'Dosing Simulation', 'Covariate Analysis']
        ],
        [
            'title' => 'Drug-Drug Interaction Study',
            'description' => 'Comprehensive evaluation of potential drug-drug interactions using physiologically-based pharmacokinetic modeling. Assessment of CYP450 enzyme inhibition and induction effects.',
            'status' => 'active',
            'start_date' => '2025-02-01',
            'end_date' => null,
            'created_by' => 1,
            'members' => [1, 3],
            'keywords' => ['drug interactions', 'CYP450', 'PBPK', 'enzyme inhibition', 'enzyme induction', 'DDI'],
            'analysis_types' => ['Population PK', 'Safety Analysis', 'Model Validation']
        ],
        [
            'title' => 'Renal Impairment PK Study',
            'description' => 'Pharmacokinetic analysis in patients with varying degrees of renal impairment. Development of dose adjustment guidelines based on creatinine clearance and eGFR.',
            'status' => 'active',
            'start_date' => '2024-12-10',
            'end_date' => null,
            'created_by' => 1,
            'members' => [1, 2],
            'keywords' => ['renal impairment', 'creatinine clearance', 'eGFR', 'dose adjustment', 'kidney function'],
            'analysis_types' => ['Population PK', 'Covariate Analysis', 'Dosing Simulation']
        ],
        [
            'title' => 'Oncology Therapeutic Drug Monitoring',
            'description' => 'Implementation of therapeutic drug monitoring protocols for oncology patients. Development of target concentration intervention strategies to optimize efficacy and minimize toxicity.',
            'status' => 'active',
            'start_date' => '2025-01-20',
            'end_date' => null,
            'created_by' => 1,
            'members' => [1, 3],
            'keywords' => ['oncology', 'TDM', 'therapeutic drug monitoring', 'target concentration', 'toxicity', 'efficacy'],
            'analysis_types' => ['Population PK', 'Dosing Simulation', 'Safety Analysis']
        ],
        [
            'title' => 'Biosimilar Comparability Assessment',
            'description' => 'Comprehensive pharmacokinetic and pharmacodynamic comparison of biosimilar and reference biological products. Statistical evaluation of similarity margins and equivalence testing.',
            'status' => 'paused',
            'start_date' => '2024-11-01',
            'end_date' => null,
            'created_by' => 1,
            'members' => [1, 2],
            'keywords' => ['biosimilar', 'comparability', 'biological products', 'equivalence', 'pharmacodynamics'],
            'analysis_types' => ['Bioequivalence', 'Statistical Analysis', 'Regulatory Submission']
        ],
        [
            'title' => 'First-in-Human Dose Escalation',
            'description' => 'Phase I dose escalation study in healthy volunteers to determine maximum tolerated dose and establish preliminary safety profile. Bayesian adaptive design implementation.',
            'status' => 'completed',
            'start_date' => '2024-09-01',
            'end_date' => '2024-12-15',
            'created_by' => 1,
            'members' => [1, 2, 3],
            'keywords' => ['first-in-human', 'dose escalation', 'MTD', 'safety', 'Bayesian design', 'phase I'],
            'analysis_types' => ['Non-compartmental Analysis', 'Safety Analysis', 'Dosing Simulation']
        ],
        [
            'title' => 'Pharmacogenomics Integration',
            'description' => 'Integration of pharmacogenomic markers into population PK models to predict drug response variability. Focus on CYP2D6, CYP2C19, and other clinically relevant polymorphisms.',
            'status' => 'active',
            'start_date' => '2025-01-05',
            'end_date' => null,
            'created_by' => 1,
            'members' => [1, 3],
            'keywords' => ['pharmacogenomics', 'genetic polymorphisms', 'CYP2D6', 'CYP2C19', 'precision medicine', 'variability'],
            'analysis_types' => ['Population PK', 'Covariate Analysis', 'Model Validation']
        ],
        [
            'title' => 'Long-Term Safety Extension Study',
            'description' => 'Long-term follow-up study to evaluate chronic dosing safety and efficacy. Analysis of time-dependent changes in pharmacokinetics and adverse event patterns.',
            'status' => 'active',
            'start_date' => '2024-08-01',
            'end_date' => null,
            'created_by' => 1,
            'members' => [1, 2],
            'keywords' => ['long-term safety', 'chronic dosing', 'adverse events', 'time-dependent', 'extension study'],
            'analysis_types' => ['Safety Analysis', 'Statistical Analysis', 'Population PK']
        ],
        [
            'title' => 'Food Effect Bioavailability Study',
            'description' => 'Investigation of food effects on drug absorption and bioavailability. Comparison of pharmacokinetic parameters under fasted and fed conditions using crossover design.',
            'status' => 'completed',
            'start_date' => '2024-11-10',
            'end_date' => '2024-12-20',
            'created_by' => 1,
            'members' => [1, 3],
            'keywords' => ['food effect', 'bioavailability', 'fasted', 'fed', 'absorption', 'crossover'],
            'analysis_types' => ['Non-compartmental Analysis', 'Bioequivalence', 'Statistical Analysis']
        ],
        [
            'title' => 'Fixed-Dose Combination Development',
            'description' => 'Pharmacokinetic evaluation of fixed-dose combination product. Assessment of individual component interactions and comparative bioavailability with separate formulations.',
            'status' => 'active',
            'start_date' => '2025-02-10',
            'end_date' => null,
            'created_by' => 1,
            'members' => [1, 2],
            'keywords' => ['fixed-dose combination', 'FDC', 'drug interactions', 'formulation', 'comparative bioavailability'],
            'analysis_types' => ['Bioequivalence', 'Non-compartmental Analysis', 'Statistical Analysis']
        ],
        [
            'title' => 'Immunogenicity Assessment Protocol',
            'description' => 'Development and validation of immunogenicity testing protocols for biological products. Risk assessment and impact analysis on pharmacokinetics and clinical outcomes.',
            'status' => 'active',
            'start_date' => '2024-12-05',
            'end_date' => null,
            'created_by' => 2,
            'members' => [2, 1],
            'keywords' => ['immunogenicity', 'biological products', 'antibodies', 'risk assessment', 'validation'],
            'analysis_types' => ['Safety Analysis', 'Statistical Analysis', 'Regulatory Submission']
        ],
        [
            'title' => 'Hepatic Impairment Dosing Study',
            'description' => 'Pharmacokinetic evaluation in patients with hepatic impairment classified by Child-Pugh criteria. Development of dose modification guidelines for varying degrees of liver dysfunction.',
            'status' => 'paused',
            'start_date' => '2024-10-15',
            'end_date' => null,
            'created_by' => 1,
            'members' => [1, 3],
            'keywords' => ['hepatic impairment', 'liver dysfunction', 'Child-Pugh', 'dose modification', 'pharmacokinetics'],
            'analysis_types' => ['Population PK', 'Covariate Analysis', 'Dosing Simulation']
        ],
        [
            'title' => 'Model-Informed Drug Development',
            'description' => 'Application of model-informed drug development principles to optimize clinical trial design. Integration of mechanistic modeling with clinical data to support regulatory submissions.',
            'status' => 'active',
            'start_date' => '2025-01-25',
            'end_date' => null,
            'created_by' => 1,
            'members' => [1, 2, 3],
            'keywords' => ['MIDD', 'clinical trial design', 'mechanistic modeling', 'regulatory', 'optimization'],
            'analysis_types' => ['Population PK', 'Dosing Simulation', 'Model Validation', 'Regulatory Submission']
        ],
        [
            'title' => 'Exposure-Response Analysis',
            'description' => 'Quantitative analysis of exposure-response relationships for efficacy and safety endpoints. Development of concentration-effect models to guide dose selection.',
            'status' => 'active',
            'start_date' => '2024-12-28',
            'end_date' => null,
            'created_by' => 1,
            'members' => [1, 3],
            'keywords' => ['exposure-response', 'concentration-effect', 'dose selection', 'efficacy', 'safety endpoints'],
            'analysis_types' => ['Population PK', 'Statistical Analysis', 'Dosing Simulation']
        ]
    ];

    $projectCount = 0;

    foreach ($projects as $projectData) {
        $members = $projectData['members'];
        $keywords = $projectData['keywords'];
        $analysisTypes = $projectData['analysis_types'];

        unset($projectData['members']);
        unset($projectData['keywords']);
        unset($projectData['analysis_types']);

        // Check if project already exists
        $checkStmt = $db->prepare("
            SELECT id FROM projects
            WHERE title = ? AND created_by = ?
        ");
        $checkStmt->execute([$projectData['title'], $projectData['created_by']]);
        $existingProject = $checkStmt->fetch();

        if ($existingProject) {
            echo "Project '{$projectData['title']}' already exists, skipping...\n";
            continue;
        }

        // Insert project
        $stmt = $db->prepare("
            INSERT INTO projects (title, description, status, start_date, end_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $projectData['title'],
            $projectData['description'],
            $projectData['status'],
            $projectData['start_date'],
            $projectData['end_date'],
            $projectData['created_by']
        ]);

        $projectId = $db->lastInsertId();
        $projectCount++;

        echo "Created project: {$projectData['title']} (ID: $projectId)\n";

        // Add members
        $memberStmt = $db->prepare("
            INSERT INTO project_members (project_id, user_id, role)
            VALUES (?, ?, ?)
        ");

        foreach ($members as $index => $memberId) {
            // First member (creator) is owner, others are members
            $role = ($memberId == $projectData['created_by']) ? 'owner' : 'member';
            $memberStmt->execute([$projectId, $memberId, $role]);
        }

        echo "  Added " . count($members) . " members\n";

        // Add keywords
        $keywordStmt = $db->prepare("
            INSERT INTO project_keywords (project_id, keyword)
            VALUES (?, ?)
        ");

        foreach ($keywords as $keyword) {
            $keywordStmt->execute([$projectId, $keyword]);
        }

        echo "  Added " . count($keywords) . " keywords\n";

        // Add analysis types
        $analysisStmt = $db->prepare("
            INSERT INTO project_analysis_types (project_id, analysis_type)
            VALUES (?, ?)
        ");

        foreach ($analysisTypes as $analysisType) {
            $analysisStmt->execute([$projectId, $analysisType]);
        }

        echo "  Added " . count($analysisTypes) . " analysis types\n\n";
    }

    echo "Projects seeding completed! Created $projectCount new projects.\n";

} catch (PDOException $e) {
    echo "Error seeding projects: " . $e->getMessage() . "\n";
    exit(1);
}
