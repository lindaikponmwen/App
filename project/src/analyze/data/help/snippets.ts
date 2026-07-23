import { Snippet } from './types';

export const snippetData: Snippet[] = [
  {
    id: 'nonmem-1',
    language: 'nonmem',
    title: 'Basic One-Compartment Model',
    description: 'A simple one-compartment model with first-order absorption and elimination.',
    code: `$PROBLEM One-Compartment Model
$INPUT ID TIME DV AMT EVID CMT
$DATA data.csv IGNORE=@
$SUBROUTINES ADVAN2 TRANS2
$PK
  TVCL = THETA(1)
  TVV  = THETA(2)
  TVKA = THETA(3)
  CL = TVCL * EXP(ETA(1))
  V  = TVV  * EXP(ETA(2))
  KA = TVKA * EXP(ETA(3))
  S2 = V
$ERROR
  Y = F * (1 + EPS(1))
$THETA
  (0, 10) ; CL
  (0, 50) ; V
  (0, 2)  ; KA
$OMEGA
  0.1 ; IIV on CL
  0.1 ; IIV on V
  0.1 ; IIV on KA
$SIGMA
  0.04 ; Proportional Error
`
  },
  {
    id: 'nonmem-3',
    language: 'nonmem',
    title: 'Basic Two-Compartment Model',
    description: 'A standard two-compartment model with first-order absorption and central elimination.',
    code: `$PROBLEM Two-Compartment Model
$INPUT ID TIME DV AMT EVID CMT
$DATA data.csv IGNORE=@
$SUBROUTINES ADVAN4 TRANS4
$PK
  TVCL = THETA(1) ; Central Clearance
  TVV2 = THETA(2) ; Central Volume
  TVQ  = THETA(3) ; Inter-compartmental Clearance
  TVV3 = THETA(4) ; Peripheral Volume
  TVKA = THETA(5) ; Absorption Rate Constant

  CL = TVCL * EXP(ETA(1))
  V2 = TVV2 * EXP(ETA(2))
  Q  = TVQ  * EXP(ETA(3))
  V3 = TVV3 * EXP(ETA(4))
  KA = TVKA * EXP(ETA(5))

  S2 = V2 ; Dose goes into central compartment, S2=Vcentral
$ERROR
  Y = F * (1 + EPS(1)) + EPS(2) ; Combined error model
$THETA
  (0, 10)   ; CL (L/hr)
  (0, 50)   ; V2 (L)
  (0, 5)    ; Q (L/hr)
  (0, 100)  ; V3 (L)
  (0, 2)    ; KA (1/hr)
$OMEGA BLOCK(5)
  0.1 ; IIV CL
  0.0 0.1 ; IIV V2
  0.0 0.0 0.1 ; IIV Q
  0.0 0.0 0.0 0.1 ; IIV V3
  0.0 0.0 0.0 0.0 0.1 ; IIV KA
$SIGMA
  0.04 ; Proportional Error
  0.01 ; Additive Error
`
  },
    {
    id: 'nonmem-4',
    language: 'nonmem',
    title: 'Basic Three-Compartment Model',
    description: 'A standard three-compartment model with first-order absorption and central elimination.',
    code: `$PROBLEM Three-Compartment Model
$INPUT ID TIME DV AMT EVID CMT
$DATA data.csv IGNORE=@
$SUBROUTINES ADVAN13 TRANS1
$PK
  TVCL = THETA(1)  ; Central Clearance
  TVV1 = THETA(2)  ; Central Volume (V1)
  TVQ2 = THETA(3)  ; Inter-compartmental Clearance 1 (Q2)
  TVV2 = THETA(4)  ; Peripheral Volume 1 (V2)
  TVQ3 = THETA(5)  ; Inter-compartmental Clearance 2 (Q3)
  TVV3 = THETA(6)  ; Peripheral Volume 2 (V3)
  TVKA = THETA(7)  ; Absorption Rate Constant

  CL = TVCL * EXP(ETA(1))
  V1 = TVV1 * EXP(ETA(2))
  Q2 = TVQ2 * EXP(ETA(3))
  V2 = TVV2 * EXP(ETA(4))
  Q3 = TVQ3 * EXP(ETA(5))
  V3 = TVV3 * EXP(ETA(6))
  KA = TVKA * EXP(ETA(7))

  S1 = V1 ; Dose goes into central compartment, S1=Vcentral
$ERROR
  Y = F * (1 + EPS(1)) ; Proportional error model
$THETA
  (0, 10)   ; CL (L/hr)
  (0, 50)   ; V1 (L)
  (0, 5)    ; Q2 (L/hr)
  (0, 100)  ; V2 (L)
  (0, 5)    ; Q3 (L/hr)
  (0, 200)  ; V3 (L)
  (0, 2)    ; KA (1/hr)
$OMEGA DIAGONAL(7)
  0.1 ; IIV CL
  0.1 ; IIV V1
  0.1 ; IIV Q2
  0.1 ; IIV V2
  0.1 ; IIV Q3
  0.1 ; IIV V3
  0.1 ; IIV KA
$SIGMA
  0.04 ; Proportional Error
`
  },
  {
    id: 'nonmem-2',
    language: 'nonmem',
    title: 'Covariate on Clearance',
    description: 'Example of adding body weight (WT) as a covariate on clearance.',
    code: `$PK
  TVCL = THETA(1) * (WT/70)**THETA(4)
  TVV  = THETA(2)
  TVKA = THETA(3)
  CL = TVCL * EXP(ETA(1))
  V  = TVV  * EXP(ETA(2))
  KA = TVKA * EXP(ETA(3))
$THETA
  (0, 10)  ; CL
  (0, 50)  ; V
  (0, 2)   ; KA
  (0, 0.75) ; WT on CL
`
  },
  {
    id: 'nonmem-pkpd-1',
    language: 'nonmem',
    title: 'Basic Effect Compartment Model',
    description: 'Models the delay between plasma concentration and effect site concentration using a hypothetical effect compartment.',
    code: `$PROBLEM Basic Effect Compartment Model
$INPUT ID TIME DV AMT EVID CMT
$DATA data.csv IGNORE=@
$SUBROUTINES ADVAN2 TRANS2
$MODEL
  COMP=(DEPOT, INITIALOFF)
  COMP=(CENTRAL)
  COMP=(EFFECT)
$PK
  KA = THETA(1) ; Absorption rate constant
  CL = THETA(2) ; Clearance
  V  = THETA(3) ; Volume of distribution
  KE0= THETA(4) ; Effect site equilibration rate constant
$DES
  DADT(1) = -KA*A(1)
  DADT(2) = KA*A(1) - (CL/V)*A(2)
  DADT(3) = KE0*(A(2)/V - A(3))
$ERROR
  CP = A(2)/V
  CE = A(3)
  Y = CE * (1 + EPS(1))
`
  },
  {
    id: 'nonmem-pkpd-2',
    language: 'nonmem',
    title: 'IDR Model I: Inhibition of Input',
    description: 'Drug inhibits the production/input rate of the response.',
    code: `$PROBLEM IDR Model I: Inhibition of Input
$INPUT ID TIME DV AMT EVID CMT
$DATA data.csv IGNORE=@
$SUBROUTINES ADVAN2 TRANS2
$MODEL
  COMP=(DEPOT, INITIALOFF)
  COMP=(CENTRAL)
  COMP=(RESPONSE, DEFOBS)
$PK
  KA = THETA(1)
  CL = THETA(2)
  V  = THETA(3)
  KIN = THETA(4)
  KOUT = THETA(5)
  IMAX = THETA(6)
  IC50 = THETA(7)
$DES
  DADT(1) = -KA*A(1)
  DADT(2) = KA*A(1) - (CL/V)*A(2)
  CP = A(2)/V
  INH = 1 - (IMAX*CP/(IC50 + CP))
  DADT(3) = KIN*INH - KOUT*A(3)
$ERROR
  RESP = A(3)
  Y = RESP * (1 + EPS(1))
`
  },
  {
    id: 'nonmem-pkpd-3',
    language: 'nonmem',
    title: 'IDR Model II: Inhibition of Loss',
    description: 'Drug inhibits the elimination/loss rate of the response.',
    code: `$PROBLEM IDR Model II: Inhibition of Loss
$INPUT ID TIME DV AMT EVID CMT
$DATA data.csv IGNORE=@
$SUBROUTINES ADVAN2 TRANS2
$MODEL
  COMP=(DEPOT, INITIALOFF)
  COMP=(CENTRAL)
  COMP=(RESPONSE, DEFOBS)
$PK
  KA = THETA(1)
  CL = THETA(2)
  V  = THETA(3)
  KIN = THETA(4)
  KOUT = THETA(5)
  IMAX = THETA(6)
  IC50 = THETA(7)
$DES
  DADT(1) = -KA*A(1)
  DADT(2) = KA*A(1) - (CL/V)*A(2)
  CP = A(2)/V
  INH = 1 - (IMAX*CP/(IC50 + CP))
  DADT(3) = KIN - KOUT*INH*A(3)
$ERROR
  RESP = A(3)
  Y = RESP * (1 + EPS(1))
`
  },
  {
    id: 'nonmem-pkpd-4',
    language: 'nonmem',
    title: 'IDR Model III: Stimulation of Input',
    description: 'Drug stimulates the production/input rate of the response.',
    code: `$PROBLEM IDR Model III: Stimulation of Input
$INPUT ID TIME DV AMT EVID CMT
$DATA data.csv IGNORE=@
$SUBROUTINES ADVAN2 TRANS2
$MODEL
  COMP=(DEPOT, INITIALOFF)
  COMP=(CENTRAL)
  COMP=(RESPONSE, DEFOBS)
$PK
  KA = THETA(1)
  CL = THETA(2)
  V  = THETA(3)
  KIN = THETA(4)
  KOUT = THETA(5)
  EMAX = THETA(6)
  EC50 = THETA(7)
$DES
  DADT(1) = -KA*A(1)
  DADT(2) = KA*A(1) - (CL/V)*A(2)
  CP = A(2)/V
  STIM = 1 + (EMAX*CP/(EC50 + CP))
  DADT(3) = KIN*STIM - KOUT*A(3)
$ERROR
  RESP = A(3)
  Y = RESP * (1 + EPS(1))
`
  },
  {
    id: 'nonmem-pkpd-5',
    language: 'nonmem',
    title: 'IDR Model IV: Stimulation of Loss',
    description: 'Drug stimulates the elimination/loss rate of the response.',
    code: `$PROBLEM IDR Model IV: Stimulation of Loss
$INPUT ID TIME DV AMT EVID CMT
$DATA data.csv IGNORE=@
$SUBROUTINES ADVAN2 TRANS2
$MODEL
  COMP=(DEPOT, INITIALOFF)
  COMP=(CENTRAL)
  COMP=(RESPONSE, DEFOBS)
$PK
  KA = THETA(1)
  CL = THETA(2)
  V  = THETA(3)
  KIN = THETA(4)
  KOUT = THETA(5)
  EMAX = THETA(6)
  EC50 = THETA(7)
$DES
  DADT(1) = -KA*A(1)
  DADT(2) = KA*A(1) - (CL/V)*A(2)
  CP = A(2)/V
  STIM = 1 + (EMAX*CP/(EC50 + CP))
  DADT(3) = KIN - KOUT*STIM*A(3)
$ERROR
  RESP = A(3)
  Y = RESP * (1 + EPS(1))
`
  },
  {
    id: 'nonmem-pkpd-6',
    language: 'nonmem',
    title: 'IDR with Precursor Pool',
    description: 'Includes an intermediate precursor compartment before the response.',
    code: `$PROBLEM IDR with Precursor Pool
$INPUT ID TIME DV AMT EVID CMT
$DATA data.csv IGNORE=@
$SUBROUTINES ADVAN4 TRANS4
$MODEL
  COMP=(DEPOT, INITIALOFF)
  COMP=(CENTRAL)
  COMP=(PRECURSOR)
  COMP=(RESPONSE, DEFOBS)
$PK
  KA = THETA(1)
  CL = THETA(2)
  V  = THETA(3)
  KIN = THETA(4)
  KOUT = THETA(5)
  IMAX = THETA(6)
  IC50 = THETA(7)
  KP = THETA(8)
$DES
  DADT(1) = -KA*A(1)
  DADT(2) = KA*A(1) - (CL/V)*A(2)
  CP = A(2)/V
  INH = 1 - (IMAX*CP/(IC50 + CP))
  DADT(3) = KIN*INH - KP*A(3)
  DADT(4) = KP*A(3) - KOUT*A(4)
$ERROR
  RESP = A(4)
  Y = RESP * (1 + EPS(1))
`
  },
  {
    id: 'nonmem-pkpd-7',
    language: 'nonmem',
    title: 'Transit Compartment Model',
    description: 'Multiple transit compartments model the delay in drug effect through a cascade.',
    code: `$PROBLEM Transit Compartment Model
$INPUT ID TIME DV AMT EVID CMT
$DATA data.csv IGNORE=@
$SUBROUTINES ADVAN13 ; General linear model solver
$MODEL NCOMP=6
  COMP=(DEPOT)
  COMP=(CENTRAL)
  COMP=(TRANSIT1)
  COMP=(TRANSIT2)
  COMP=(TRANSIT3)
  COMP=(RESPONSE, DEFOBS)
$PK
  KA = THETA(1)
  CL = THETA(2)
  V  = THETA(3)
  KIN = THETA(4)
  KOUT = THETA(5)
  IMAX = THETA(6)
  IC50 = THETA(7)
  KTR = THETA(8)
$DES
  DADT(1) = -KA*A(1)
  DADT(2) = KA*A(1) - (CL/V)*A(2)
  CP = A(2)/V
  INH = 1 - (IMAX*CP/(IC50 + CP))
  DADT(3) = KIN*INH - KTR*A(3)
  DADT(4) = KTR*A(3) - KTR*A(4)
  DADT(5) = KTR*A(4) - KTR*A(5)
  DADT(6) = KTR*A(5) - KOUT*A(6)
$ERROR
  RESP = A(6)
  Y = RESP * (1 + EPS(1))
`
  },
  {
    id: 'nonmem-pkpd-8',
    language: 'nonmem',
    title: 'Tolerance Model (Counter-Regulation)',
    description: 'Models development of tolerance through a moderator function.',
    code: `$PROBLEM Tolerance Model (Counter-Regulation)
$INPUT ID TIME DV AMT EVID CMT
$DATA data.csv IGNORE=@
$SUBROUTINES ADVAN4 TRANS4
$MODEL
  COMP=(DEPOT, INITIALOFF)
  COMP=(CENTRAL)
  COMP=(RESPONSE, DEFOBS)
  COMP=(MODERATOR)
$PK
  KA = THETA(1)
  CL = THETA(2)
  V  = THETA(3)
  KIN = THETA(4)
  KOUT = THETA(5)
  EMAX = THETA(6)
  EC50 = THETA(7)
  KM = THETA(8)
$DES
  DADT(1) = -KA*A(1)
  DADT(2) = KA*A(1) - (CL/V)*A(2)
  CP = A(2)/V
  STIM = 1 + (EMAX*CP/(EC50 + CP))
  DADT(3) = KIN*STIM/(1 + A(4)) - KOUT*A(3)
  DADT(4) = KM*CP - KM*A(4)
$ERROR
  RESP = A(3)
  Y = RESP * (1 + EPS(1))
`
  },
  {
    id: 'nonmem-pkpd-9',
    language: 'nonmem',
    title: 'Sigmoid Emax with Effect Compartment',
    description: 'Combines effect compartment with sigmoid concentration-effect relationship.',
    code: `$PROBLEM Sigmoid Emax with Effect Compartment
$INPUT ID TIME DV AMT EVID CMT
$DATA data.csv IGNORE=@
$SUBROUTINES ADVAN4 TRANS4
$MODEL
  COMP=(DEPOT, INITIALOFF)
  COMP=(CENTRAL)
  COMP=(EFFECT)
  COMP=(RESPONSE, DEFOBS)
$PK
  KA = THETA(1)
  CL = THETA(2)
  V  = THETA(3)
  KE0 = THETA(4)
  KIN = THETA(5)
  KOUT = THETA(6)
  EMAX = THETA(7)
  EC50 = THETA(8)
  GAMMA = THETA(9)
$DES
  DADT(1) = -KA*A(1)
  DADT(2) = KA*A(1) - (CL/V)*A(2)
  DADT(3) = KE0*(A(2)/V - A(3))
  CE = A(3)
  STIM = 1 + (EMAX*CE**GAMMA/(EC50**GAMMA + CE**GAMMA))
  DADT(4) = KIN*STIM - KOUT*A(4)
$ERROR
  RESP = A(4)
  Y = RESP * (1 + EPS(1))
`
  },
  {
    id: 'nonmem-pkpd-10',
    language: 'nonmem',
    title: 'Irreversible Effect Model',
    description: 'Models irreversible drug effects (e.g., killing of cells or bacteria).',
    code: `$PROBLEM Irreversible Effect Model
$INPUT ID TIME DV AMT EVID CMT
$DATA data.csv IGNORE=@
$SUBROUTINES ADVAN2 TRANS2
$MODEL
  COMP=(DEPOT, INITIALOFF)
  COMP=(CENTRAL)
  COMP=(RESPONSE, DEFOBS)
$PK
  KA = THETA(1)
  CL = THETA(2)
  V  = THETA(3)
  KMAX = THETA(4)
  KC50 = THETA(5)
$DES
  DADT(1) = -KA*A(1)
  DADT(2) = KA*A(1) - (CL/V)*A(2)
  CP = A(2)/V
  KILL = KMAX*CP/(KC50 + CP)
  DADT(3) = -KILL*A(3)
$ERROR
  RESP = A(3)
  Y = RESP * (1 + EPS(1))
`
  },
  {
    id: 'mrgsolve-1',
    language: 'r',
    title: 'One-Compartment Model (mrgsolve)',
    description: 'A one-compartment model with first-order absorption using mrgsolve.',
    code: `library(mrgsolve)

code <- '
$PARAM TVCL = 10, TVV = 50, TVKA = 1.2
$PARAM ETA_CL=0, ETA_V=0, ETA_KA=0

$OMEGA 0.1 0.1 0.1

$SIGMA 0.04 // proportional error

$CMT DEPOT CENT

$PK
  CL = TVCL * exp(ETA_CL + ETA(1));
  V  = TVV  * exp(ETA_V  + ETA(2));
  KA = TVKA * exp(ETA_KA + ETA(3));

$DES
  dxdt_DEPOT = -KA * DEPOT;
  dxdt_CENT  =  KA * DEPOT - (CL/V) * CENT;

$CAPTURE CP = CENT/V;
$ERROR
  Y = CP * (1 + EPS(1));
'

mod <- mread(code = code, model = "one_cmt")
`
  },
  {
    id: 'mrgsolve-2',
    language: 'r',
    title: 'Two-Compartment Model (mrgsolve)',
    description: 'A two-compartment model with first-order absorption using mrgsolve.',
    code: `library(mrgsolve)

code <- '
$PARAM TVCL=10, TVV=50, TVQ=5, TVVP=100, TVKA=1.2
$PARAM ETA_CL=0, ETA_V=0, ETA_Q=0, ETA_VP=0, ETA_KA=0

$OMEGA 0.1 0.1 0.1 0.1 0.1

$SIGMA 0.04 // proportional error

$CMT DEPOT CENT PERIPH

$PK
  CL = TVCL * exp(ETA_CL + ETA(1));
  V  = TVV  * exp(ETA_V  + ETA(2));
  Q  = TVQ  * exp(ETA_Q  + ETA(3));
  VP = TVVP * exp(ETA_VP + ETA(4));
  KA = TVKA * exp(ETA_KA + ETA(5));

$DES
  dxdt_DEPOT = -KA * DEPOT;
  dxdt_CENT  =  KA * DEPOT - (CL/V)*CENT - (Q/V)*CENT + (Q/VP)*PERIPH;
  dxdt_PERIPH = (Q/V)*CENT - (Q/VP)*PERIPH;

$CAPTURE CP = CENT/V;
$ERROR
  Y = CP * (1 + EPS(1));
'

mod <- mread(code = code, model = "two_cmt")
`
  },
  {
    id: 'mrgsolve-3',
    language: 'r',
    title: 'Three-Compartment Model (mrgsolve)',
    description: 'A three-compartment model with first-order absorption using mrgsolve.',
    code: `library(mrgsolve)

code <- '
$PARAM TVCL=10, TVV=50, TVQ1=5, TVVP1=100, TVQ2=3, TVVP2=200, TVKA=1.2
$OMEGA 0.1 0.1 0.1 0.1 0.1 0.1 0.1

$SIGMA 0.04 // proportional error

$CMT DEPOT CENT PERIPH1 PERIPH2

$PK
  CL  = TVCL  * exp(ETA(1));
  V   = TVV   * exp(ETA(2));
  Q1  = TVQ1  * exp(ETA(3));
  VP1 = TVVP1 * exp(ETA(4));
  Q2  = TVQ2  * exp(ETA(5));
  VP2 = TVVP2 * exp(ETA(6));
  KA  = TVKA  * exp(ETA(7));

$DES
  dxdt_DEPOT = -KA * DEPOT;
  dxdt_CENT  =  KA * DEPOT - (CL/V)*CENT - (Q1/V)*CENT + (Q1/VP1)*PERIPH1 - (Q2/V)*CENT + (Q2/VP2)*PERIPH2;
  dxdt_PERIPH1 = (Q1/V)*CENT - (Q1/VP1)*PERIPH1;
  dxdt_PERIPH2 = (Q2/V)*CENT - (Q2/VP2)*PERIPH2;

$CAPTURE CP = CENT/V;
$ERROR
  Y = CP * (1 + EPS(1));
'

mod <- mread(code = code, model = "three_cmt")
`
  },
  {
    id: 'monolix-1',
    language: 'monolix',
    title: 'One-Compartment Model (MONOLIX)',
    description: 'A one-compartment PK model with first-order absorption for Monolix (MLXTRAN).',
    code: `[LONGITUDINAL]
input = {ka, V, Cl}
PK:
depot(target=Ad)
iv(adm=2)
oral(adm=1, depot=Ad)
Cc = Ad_central/V
elimination = Cl*Cc
EQUATION:
ddt_Ad = -ka*Ad
ddt_Ad_central = ka*Ad - Cl*Cc
OUTPUT:
output = Cc
`
  },
  {
    id: 'monolix-2',
    language: 'monolix',
    title: 'Two-Compartment Model (MONOLIX)',
    description: 'A two-compartment PK model with first-order absorption for Monolix (MLXTRAN).',
    code: `[LONGITUDINAL]
input = {ka, V, Cl, Q, Vp}
PK:
depot(target=Ad)
Cc = Ad_central/V
k12 = Q/V
k21 = Q/Vp
elimination = Cl*Cc
transfer = Cc - Ad_peripheral/Vp
EQUATION:
ddt_Ad = -ka*Ad
ddt_Ad_central = ka*Ad - k12*Ad_central + k21*Ad_peripheral - elimination
ddt_Ad_peripheral = k12*Ad_central - k21*Ad_peripheral
OUTPUT:
output = Cc
`
  },
  {
    id: 'monolix-3',
    language: 'monolix',
    title: 'Three-Compartment Model (MONOLIX)',
    description: 'A three-compartment PK model with first-order absorption for Monolix (MLXTRAN).',
    code: `[LONGITUDINAL]
input = {ka, V, Cl, Q1, Vp1, Q2, Vp2}
PK:
depot(target=Ad)
Cc = Ad_central/V
k12 = Q1/V
k21 = Q1/Vp1
k13 = Q2/V
k31 = Q2/Vp2
elimination = Cl*Cc
EQUATION:
ddt_Ad = -ka*Ad
ddt_Ad_central = ka*Ad - (k12+k13)*Ad_central + k21*Ad_peripheral1 + k31*Ad_peripheral2 - elimination
ddt_Ad_peripheral1 = k12*Ad_central - k21*Ad_peripheral1
ddt_Ad_peripheral2 = k13*Ad_central - k31*Ad_peripheral2
OUTPUT:
output = Cc
`
  },
  {
    id: 'julia-1',
    language: 'julia',
    title: 'One-Compartment Model (Julia)',
    description: 'A one-compartment differential equation model for pharmacokinetic analysis in Julia.',
    code: `function one_cmt!(du, u, p, t)
    ka, V, CL = p
    Depot, Central = u

    du[1] = -ka * Depot
    du[2] =  ka * Depot - (CL/V) * Central
end
`
  },
  {
    id: 'julia-2',
    language: 'julia',
    title: 'Two-Compartment Model (Julia)',
    description: 'A two-compartment differential equation model for pharmacokinetic analysis in Julia.',
    code: `function two_cmt!(du, u, p, t)
    ka, V, CL, Q, Vp = p
    Depot, Central, Peripheral = u

    k12 = Q/V
    k21 = Q/Vp

    du[1] = -ka * Depot
    du[2] =  ka * Depot - (CL/V)*Central - k12*Central + k21*Peripheral
    du[3] =  k12*Central - k21*Peripheral
end
`
  },
  {
    id: 'julia-3',
    language: 'julia',
    title: 'Three-Compartment Model (Julia)',
    description: 'A three-compartment differential equation model for pharmacokinetic analysis in Julia.',
    code: `function three_cmt!(du, u, p, t)
    ka, V, CL, Q1, Vp1, Q2, Vp2 = p
    Depot, Central, Peripheral1, Peripheral2 = u

    k12 = Q1/V
    k21 = Q1/Vp1
    k13 = Q2/V
    k31 = Q2/Vp2

    du[1] = -ka * Depot
    du[2] =  ka * Depot - (CL/V)*Central - (k12+k13)*Central + k21*Peripheral1 + k31*Peripheral2
    du[3] =  k12*Central - k21*Peripheral1
    du[4] =  k13*Central - k31*Peripheral2
end
`
  },
  {
    id: 'r-gof',
    language: 'r',
    title: 'R Goodness-of-Fit Plots (ggplot2)',
    description: 'Generate standard goodness-of-fit plots using ggplot2 (DV vs PRED, DV vs IPRED, etc.).',
    code: `library(ggplot2)
library(patchwork)

# Assuming 'results_df' has columns DV, PRED, IPRED, CWRES, TIME

p1 <- ggplot(results_df, aes(x = PRED, y = DV)) +
  geom_point(alpha=0.5) +
  geom_abline(intercept=0, slope=1, color="red") +
  geom_smooth(method="loess", se=FALSE, color="blue") +
  labs(title="Observed vs. Population Predictions", x="PRED", y="DV")

p2 <- ggplot(results_df, aes(x = IPRED, y = DV)) +
  geom_point(alpha=0.5) +
  geom_abline(intercept=0, slope=1, color="red") +
  geom_smooth(method="loess", se=FALSE, color="blue") +
  labs(title="Observed vs. Individual Predictions", x="IPRED", y="DV")

p3 <- ggplot(results_df, aes(x = PRED, y = CWRES)) +
  geom_point(alpha=0.5) +
  geom_hline(yintercept=0, color="red") +
  geom_smooth(method="loess", se=FALSE, color="blue") +
  labs(title="CWRES vs. Population Predictions", x="PRED", y="CWRES")

p4 <- ggplot(results_df, aes(x = TIME, y = CWRES)) +
  geom_point(alpha=0.5) +
  geom_hline(yintercept=0, color="red") +
  geom_smooth(method="loess", se=FALSE, color="blue") +
  labs(title="CWRES vs. Time", x="Time", y="CWRES")

(p1 + p2) / (p3 + p4)
`
  },
  {
    id: 'r-vpc',
    language: 'r',
    title: 'R Visual Predictive Check (ggplot2)',
    description: 'Create a Visual Predictive Check (VPC) plot using ggplot2.',
    code: `library(ggplot2)

# Assuming 'vpc_df' has columns for time, observations (obs),
# and simulation percentiles (p5, p50, p95)

ggplot(vpc_df) +
  geom_ribbon(aes(x = time, ymin = p5, ymax = p95), fill = "blue", alpha = 0.2) +
  geom_ribbon(aes(x = time, ymin = ci_low_p50, ymax = ci_high_p50), fill = "red", alpha = 0.3) +
  geom_line(aes(x = time, y = p50), color = "blue", linetype = "dashed", size=1) +
  geom_point(aes(x = time, y = obs), color = "black", alpha = 0.5) +
  scale_y_log10() +
  labs(
    title = "Visual Predictive Check",
    x = "Time (hours)",
    y = "Concentration"
  )
`
  },
  {
    id: 'r-diagnostics',
    language: 'r',
    title: 'R Model Diagnostics (ggplot2)',
    description: 'Plots for other model diagnostics, such as ETA vs. Covariates and ETA histograms.',
    code: `library(ggplot2)
library(tidyr)

# Assuming 'eta_df' has columns for ETAs (e.g., ETA1, ETA2) and covariates (e.g., WT, AGE)

# ETA vs Covariate scatter plots
ggplot(eta_df, aes(x = WT, y = ETA1)) +
  geom_point(alpha=0.6) +
  geom_smooth(method="loess", se=FALSE) +
  labs(title="ETA on CL vs. Weight", x="Weight (kg)", y="ETA(CL)")

# ETA histograms
eta_long <- eta_df %>% pivot_longer(cols = starts_with("ETA"), names_to = "ETA", values_to = "value")

ggplot(eta_long, aes(x = value)) +
  geom_histogram(aes(y=..density..), bins=15, fill="lightblue", color="black") +
  geom_density(color="blue", size=1) +
  facet_wrap(~ETA, scales = "free") +
  labs(title="Distribution of ETAs")
`
  },
  {
    id: 'r-load',
    language: 'r',
    title: 'Load Data with readr',
    description: 'A common way to load a CSV file into R using the `readr` library.',
    code: `library(readr)
library(dplyr)

# Load the dataset
pk_data <- read_csv("data/plasma_concentrations.csv")

# Glimpse the data structure
glimpse(pk_data)
`
  },
  {
    id: 'r-plot',
    language: 'r',
    title: 'Basic ggplot for PK Profile',
    description: 'Generate a spaghetti plot of concentration vs. time for each individual.',
    code: `library(ggplot2)

ggplot(pk_data, aes(x = TIME, y = DV, group = ID)) +
  geom_line(alpha = 0.6) +
  geom_point() +
  scale_y_log10() +
  labs(
    title = "Concentration-Time Profile",
    x = "Time (hours)",
    y = "Concentration (ng/mL)"
  ) +
  theme_minimal()
`
  }
];