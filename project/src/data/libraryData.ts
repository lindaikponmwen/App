import { FileText, FileArchive, Presentation } from 'lucide-react';
import { ElementType } from 'react';

export interface LibraryFile {
  name: string;
  type: string;
  size: string;
  icon: ElementType;
  color: string;
}

export interface LibraryPublication {
  title: string;
  authors: string;
  journal: string;
  date: string;
}

export const mockFiles: LibraryFile[] = [
  { name: 'Research_Notes.docx', type: 'Word Document', size: '2.3 MB', icon: FileText, color: 'text-blue-500' },
  { name: 'Dataset_A.zip', type: 'ZIP Archive', size: '157 MB', icon: FileArchive, color: 'text-yellow-500' },
  { name: 'Presentation_Slides.pptx', type: 'PowerPoint', size: '12.1 MB', icon: Presentation, color: 'text-orange-500' },
  { name: 'Protocol_v3.pdf', type: 'PDF Document', size: '850 KB', icon: FileText, color: 'text-red-500' },
];

export const mockPublications: LibraryPublication[] = [
  {
    title: 'Pharmacokinetic Modeling in Drug Development: Current Approaches and Future Directions',
    authors: 'Smith JA, Johnson MB, Williams CD',
    journal: 'Clinical Pharmacokinetics',
    date: 'Jan 2024',
  },
  {
    title: 'Machine Learning Applications in Clinical Pharmacology: A Systematic Review',
    authors: 'Anderson PQ, Martinez EF, Thompson GH',
    journal: 'Nature Reviews Drug Discovery',
    date: 'Mar 2024',
  },
   {
    title: 'Bioequivalence Studies: Statistical Methods and Regulatory Considerations',
    authors: 'Brown KL, Davis RM, Taylor SN',
    journal: 'Pharmaceutical Research',
    date: 'Feb 2024',
  }
];

export const usedStorage = 4.2; // in GB
export const totalStorage = 15; // in GB
