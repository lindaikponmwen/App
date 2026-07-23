import { FileNode } from './dashboardData';

export const presentationsFileStructure: FileNode[] = [
  {
    id: 'pres-1',
    name: 'Abstracts',
    type: 'folder',
    children: [
     
    ]
  },
  {
    id: 'pres-3',
    name: 'Posters',
    type: 'folder',
    children: [
    ]
  },
  {
    id: 'pres-5',
    name: 'Talks',
    type: 'folder',
    children: [
    ]
  }
];

export const presentationsFileContents: Record<string, string> = {
  'pres-2': JSON.stringify({
    "id": "pres-2-data",
    "themeId": "office",
    "slides": [
      {
        "id": "pres-2-slide-1",
        "background": { "color": "#FFFFFF" },
        "elements": [
          {
            "id": "elem-p2-s1-1",
            "type": "text",
            "content": "Pharmacokinetic Modeling of TAK-6742",
            "position": { "top": "15%", "left": "10%" },
            "size": { "width": "80%", "height": "auto" },
            "style": { "fontSize": "44px", "fontWeight": "bold", "textAlign": "center", "color": "#2F5496", "fontFamily": "Calibri, Arial, sans-serif" }
          },
          {
            "id": "elem-p2-s1-2",
            "type": "text",
            "content": "A First-in-Human Dose-Escalation Study in Advanced Solid Tumors",
            "position": { "top": "40%", "left": "10%" },
            "size": { "width": "80%", "height": "auto" },
            "style": { "fontSize": "28px", "textAlign": "center", "color": "#444444", "fontFamily": "Calibri, Arial, sans-serif" }
          },
          {
            "id": "elem-p2-s1-3",
            "type": "text",
            "content": "Dr. Sarah Chen, Dr. Michael Rodriguez, et al.\nPharmacometrics AI Group",
            "position": { "top": "70%", "left": "10%" },
            "size": { "width": "80%", "height": "auto" },
            "style": { "fontSize": "20px", "textAlign": "center", "color": "#595959", "fontFamily": "Calibri, Arial, sans-serif" }
          }
        ],
        "notes": "Title slide for the ASCPT 2025 abstract presentation."
      },
      {
        "id": "pres-2-slide-2",
        "background": { "color": "#FFFFFF" },
        "elements": [
          {
            "id": "elem-p2-s2-1",
            "type": "text",
            "content": "Background & Methods",
            "position": { "top": "5%", "left": "5%" },
            "size": { "width": "90%", "height": "auto" },
            "style": { "fontSize": "36px", "fontWeight": "bold", "color": "#2F5496", "fontFamily": "Calibri, Arial, sans-serif" }
          },
          {
            "id": "elem-p2-s2-2",
            "type": "text",
            "content": "Background:\n• TAK-6742 is a humanized IgG1 mAb targeting PD-L1.\n• First-in-human study in 138 patients with advanced solid tumors.\n\nMethods:\n• A two-compartment model with parallel linear and Michaelis-Menten elimination was used.\n• Receptor occupancy was modeled using an indirect response model.\n• Tumor response (RECIST 1.1) was analyzed using logistic regression.",
            "position": { "top": "20%", "left": "5%" },
            "size": { "width": "90%", "height": "70%" },
            "style": { "fontSize": "22px", "color": "#444444", "fontFamily": "Calibri, Arial, sans-serif" }
          }
        ],
        "notes": "Summary of the study background and the modeling methods used."
      },
      {
        "id": "pres-2-slide-3",
        "background": { "color": "#FFFFFF" },
        "elements": [
          {
            "id": "elem-p2-s3-1",
            "type": "text",
            "content": "Results & Conclusions",
            "position": { "top": "5%", "left": "5%" },
            "size": { "width": "90%", "height": "auto" },
            "style": { "fontSize": "36px", "fontWeight": "bold", "color": "#2F5496", "fontFamily": "Calibri, Arial, sans-serif" }
          },
          {
            "id": "elem-p2-s3-2",
            "type": "text",
            "content": "Results:\n• Nonlinear PK observed, with target-mediated drug disposition at doses <3 mg/kg.\n• >90% T-cell receptor occupancy at doses ≥10 mg/kg.\n• Cavg >100 μg/mL linked to higher objective response rates (32% vs 8%, p<0.01).\n\nConclusions:\n• Clear exposure-response relationship established.\n• A flat dose of 480 mg Q3W is supported for Phase 2 studies.",
            "position": { "top": "20%", "left": "5%" },
            "size": { "width": "90%", "height": "70%" },
            "style": { "fontSize": "22px", "color": "#444444", "fontFamily": "Calibri, Arial, sans-serif" }
          }
        ],
        "notes": "Key results from the analysis and the final conclusions drawn."
      }
    ]
  }),
  'pres-4': JSON.stringify({
    "id": "pres-4-data",
    "themeId": "ion",
    "slides": [
      {
        "id": "pres-4-slide-1",
        "background": { "color": "#F8F9FA" },
        "elements": [
          {
            "id": "elem-p4-s1-1",
            "type": "text",
            "content": "PK/PD Modeling of Monoclonal Antibody TAK-6742",
            "position": { "top": "2%", "left": "2%" },
            "size": { "width": "96%", "height": "auto" },
            "style": { "fontSize": "32px", "fontWeight": "bold", "textAlign": "center", "color": "#0078D4", "fontFamily": "\"Segoe UI\", Tahoma, sans-serif" }
          },
          {
            "id": "elem-p4-s1-2",
            "type": "text",
            "content": "S. Chen, M. Rodriguez, E. Watson, J. Liu, W. Hane\nPharmacometrics AI, Inc.",
            "position": { "top": "12%", "left": "2%" },
            "size": { "width": "96%", "height": "auto" },
            "style": { "fontSize": "16px", "textAlign": "center", "color": "#323130", "fontFamily": "\"Segoe UI\", Tahoma, sans-serif" }
          },
          {
            "id": "elem-p4-s1-3",
            "type": "shape",
            "shapeType": "rectangle",
            "content": "",
            "position": { "top": "20%", "left": "2%" },
            "size": { "width": "30%", "height": "35%" },
            "style": { "backgroundColor": "#FFFFFF", "border": "1px solid #E1E1E1" }
          },
          {
            "id": "elem-p4-s1-4",
            "type": "text",
            "content": "Introduction\n• TAK-6742: humanized IgG1 mAb targeting PD-L1.\n• Goal: Characterize PK/PD and exposure-response in advanced solid tumors.",
            "position": { "top": "21%", "left": "3%" },
            "size": { "width": "28%", "height": "auto" },
            "style": { "fontSize": "14px", "color": "#323130", "fontFamily": "\"Segoe UI\", Tahoma, sans-serif" }
          },
          {
            "id": "elem-p4-s1-5",
            "type": "shape",
            "shapeType": "rectangle",
            "content": "",
            "position": { "top": "20%", "left": "34%" },
            "size": { "width": "64%", "height": "75%" },
            "style": { "backgroundColor": "#FFFFFF", "border": "1px solid #E1E1E1" }
          },
          {
            "id": "elem-p4-s1-6",
            "type": "text",
            "content": "Results",
            "position": { "top": "21%", "left": "35%" },
            "size": { "width": "62%", "height": "auto" },
            "style": { "fontSize": "20px", "fontWeight": "bold", "color": "#0078D4", "fontFamily": "\"Segoe UI\", Tahoma, sans-serif" }
          },
          {
            "id": "elem-p4-s1-7",
            "type": "image",
            "content": "https://via.placeholder.com/400x200?text=Exposure-Response+Plot",
            "position": { "top": "30%", "left": "36%" },
            "size": { "width": "60%", "height": "30%" },
            "style": { "objectFit": "contain" }
          },
          {
            "id": "elem-p4-s1-8",
            "type": "text",
            "content": "• Cavg >100 μg/mL showed higher ORR (32% vs 8%, p<0.01).\n• Flat dose of 480 mg Q3W supported for Phase 2.",
            "position": { "top": "62%", "left": "36%" },
            "size": { "width": "60%", "height": "auto" },
            "style": { "fontSize": "14px", "color": "#323130", "fontFamily": "\"Segoe UI\", Tahoma, sans-serif" }
          },
          {
            "id": "elem-p4-s1-9",
            "type": "shape",
            "shapeType": "rectangle",
            "content": "",
            "position": { "top": "57%", "left": "2%" },
            "size": { "width": "30%", "height": "38%" },
            "style": { "backgroundColor": "#FFFFFF", "border": "1px solid #E1E1E1" }
          },
          {
            "id": "elem-p4-s1-10",
            "type": "text",
            "content": "Conclusions\n• A clear exposure-response relationship was identified for TAK-6742, guiding dose selection for future studies.",
            "position": { "top": "58%", "left": "3%" },
            "size": { "width": "28%", "height": "auto" },
            "style": { "fontSize": "14px", "color": "#323130", "fontFamily": "\"Segoe UI\", Tahoma, sans-serif" }
          }
        ],
        "notes": "PAGE 2025 Poster presentation slide."
      }
    ]
  }),
  'pres-6': JSON.stringify({
    "id": "pres-6-data",
    "themeId": "organic",
    "slides": [
      {
        "id": "pres-6-slide-1",
        "background": { "gradient": "linear-gradient(to right, #F3F9E3, #E8F5E9)" },
        "elements": [
          {
            "id": "elem-p6-s1-1",
            "type": "text",
            "content": "Project TAK-6742: Internal Update",
            "position": { "top": "30%", "left": "5%" },
            "size": { "width": "90%", "height": "auto" },
            "style": { "fontSize": "48px", "fontWeight": "bold", "textAlign": "center", "color": "#43A047", "fontFamily": "Georgia, serif" }
          },
          {
            "id": "elem-p6-s1-2",
            "type": "text",
            "content": "June 2025",
            "position": { "top": "55%", "left": "5%" },
            "size": { "width": "90%", "height": "auto" },
            "style": { "fontSize": "24px", "textAlign": "center", "color": "#555555", "fontFamily": "Georgia, serif" }
          }
        ]
      },
      {
        "id": "pres-6-slide-2",
        "background": { "gradient": "linear-gradient(to right, #F3F9E3, #E8F5E9)" },
        "elements": [
          {
            "id": "elem-p6-s2-1",
            "type": "text",
            "content": "Agenda",
            "position": { "top": "5%", "left": "5%" },
            "size": { "width": "90%", "height": "auto" },
            "style": { "fontSize": "36px", "fontWeight": "bold", "color": "#43A047", "fontFamily": "Georgia, serif" }
          },
          {
            "id": "elem-p6-s2-2",
            "type": "text",
            "content": "1. Q2 Progress Summary\n2. Key Finding: Exposure-Response Relationship\n3. Next Steps for Q3\n4. Q&A",
            "position": { "top": "25%", "left": "10%" },
            "size": { "width": "80%", "height": "auto" },
            "style": { "fontSize": "28px", "color": "#555555", "lineHeight": "1.8", "fontFamily": "Georgia, serif" }
          }
        ]
      },
      {
        "id": "pres-6-slide-3",
        "background": { "gradient": "linear-gradient(to right, #F3F9E3, #E8F5E9)" },
        "elements": [
          {
            "id": "elem-p6-s3-1",
            "type": "text",
            "content": "Key Finding: Exposure-Response",
            "position": { "top": "5%", "left": "5%" },
            "size": { "width": "90%", "height": "auto" },
            "style": { "fontSize": "36px", "fontWeight": "bold", "color": "#43A047", "fontFamily": "Georgia, serif" }
          },
          {
            "id": "elem-p6-s3-2",
            "type": "text",
            "content": "Patients with average concentration >100 μg/mL had a significantly higher objective response rate.",
            "position": { "top": "20%", "left": "5%" },
            "size": { "width": "90%", "height": "auto" },
            "style": { "fontSize": "22px", "textAlign": "center", "color": "#555555", "fontFamily": "Georgia, serif" }
          },
          {
            "id": "elem-p6-s3-3",
            "type": "image",
            "content": "https://via.placeholder.com/600x300?text=Response+Rate+vs+Cavg+Quartiles",
            "position": { "top": "35%", "left": "10%" },
            "size": { "width": "80%", "height": "55%" },
            "style": { "objectFit": "contain" }
          }
        ]
      }
    ]
  }),
};