import React, { useState, useEffect } from 'react';
// FIX: Replaced non-existent 'FilePdf' icon with 'FileText'.
import { Search, Users, BookOpen, ExternalLink, Star, Loader2, AlertCircle, X, Calendar, FileText, Quote, ChevronDown, Building, TestTube, Dna, Beaker, Route, Archive, FlaskConical, ClipboardList, ClipboardEdit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useFiles, FileNode } from '../contexts/FileContext';


interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  publishDate: string;
  abstract?: string;
  doi?: string;
  pmcid?: string;
  keywords?: string[];
  url: string;
  pdfAvailable?: boolean;
  pmcUrl?: string;
  citationCount?: number;
}

interface DrugFDAResult {
  application_number: string;
  sponsor_name: string;
  products: {
    product_number: string;
    brand_name: string;
    marketing_status: string;
    active_ingredients: { name: string; strength: string }[];
  }[];
  submissions: {
      submission_type: string;
      submission_number: string;
      submission_status: string;
      submission_status_date: string;
  }[];
  openfda?: {
    brand_name: string[];
    generic_name: string[];
    manufacturer_name: string[];
    spl_set_id: string[];
  };
  label_details?: {
      indications_and_usage?: string[];
      warnings?: string[];
      dosage_and_administration?: string[];
      description?: string[];
      generic_name?: string[];
      manufacturer_name?: string[];
      pharm_class_moa?: string[];
      route?: string[];
  }
}

interface ClinicalTrialResult {
    protocolSection: {
        identificationModule: {
            nctId: string;
            officialTitle: string;
            briefTitle: string;
        };
        statusModule: {
            overallStatus: string;
            startDateStruct?: { date: string };
        };
        sponsorCollaboratorsModule?: {
            leadSponsor: { name: string };
        };
        conditionsModule?: {
            conditions: string[];
        };
        descriptionModule: {
            briefSummary: string;
        };
        designModule: {
            studyType: string;
            phases?: string[];
            designInfo: {
                interventionModel?: string;
                primaryPurpose?: string;
                maskingInfo?: {
                    masking?: string;
                };
            };
            enrollmentInfo: {
                count: number;
            };
        };
        eligibilityModule: {
            eligibilityCriteria: string;
            healthyVolunteers: boolean;
            sex: string;
            minimumAge: string;
            maximumAge: string;
        };
    };
}


interface UniProtReferenceCitation {
  title: string;
  authors: string[];
  publicationDate: string;
  journalAbbreviation?: string;
  journalName?: string;
  firstPage?: string;
  lastPage?: string;
  volume?: string;
}

interface UniProtReference {
    citation: UniProtReferenceCitation;
    citationCrossReferences?: {
        database: string;
        id: string;
    }[];
}

interface UniProtEntry {
    primaryAccession: string;
    uniProtkbId: string;
    proteinDescription?: {
        recommendedName?: {
            fullName?: {
                value: string;
            };
        };
    };
    genes?: {
        geneName?: {
            value: string;
        };
    }[];
    organism?: {
        scientificName: string;
    };
    comments?: {
        commentType: string;
        texts?: { value: string }[];
    }[];
    sequence?: {
        value: string;
        length: number;
        molWeight: number;
    };
    references?: UniProtReference[];
}


export default function SearchPage() {
  const { fileTree, addNode, updateFileContentById } = useFiles();
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<PubMedArticle[]>([]);
  const [drugs, setDrugs] = useState<DrugFDAResult[]>([]);
  const [trials, setTrials] = useState<ClinicalTrialResult[]>([]);
  const [uniprotEntries, setUniprotEntries] = useState<UniProtEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());
  const [selectedArticle, setSelectedArticle] = useState<PubMedArticle | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<DrugFDAResult | null>(null);
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrialResult | null>(null);
  const [selectedUniprotEntry, setSelectedUniprotEntry] = useState<UniProtEntry | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('pubdate');
  const [isArticleInfoCollapsed, setIsArticleInfoCollapsed] = useState(true);
  const [isDrugInfoCollapsed, setIsDrugInfoCollapsed] = useState(true);
  const [isCriteriaCollapsed, setIsCriteriaCollapsed] = useState(true);
  const [searchSource, setSearchSource] = useState<'pubmed' | 'drug' | 'clinicaltrials' | 'uniprot'>('pubmed');
  const [trialPageTokens, setTrialPageTokens] = useState<Record<number, string>>({ 1: '' });
  const [viewMode, setViewMode] = useState<'search' | 'saved'>('search');

  const clearAllResults = () => {
    setArticles([]);
    setDrugs([]);
    setTrials([]);
    setUniprotEntries([]);
    setSelectedArticle(null);
    setSelectedDrug(null);
    setSelectedTrial(null);
    setSelectedUniprotEntry(null);
    setTotalResults(0);
    setError(null);
    setCurrentPage(1);
  }

  useEffect(() => {
    const referencesFile = fileTree.children?.find(node => node.name === '.references' && node.type === 'file');
    if (referencesFile && referencesFile.content) {
        try {
            const saved: PubMedArticle[] = JSON.parse(referencesFile.content);
            const pmidSet = new Set(saved.map(a => a.pmid));
            setSavedArticles(pmidSet);
        } catch (e) {
            console.error("Could not parse .references file", e);
            setSavedArticles(new Set());
        }
    }
  }, [fileTree]);

  const searchPubMed = async (query: string, page: number = 1, rpp: number = resultsPerPage, sort: string = sortBy) => {
    if (!query.trim()) {
        clearAllResults();
        return;
    }
    setIsLoading(true);
    setError(null);
    clearAllResults();

    try {
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${rpp}&retstart=${(page - 1) * rpp}&retmode=json&sort=${sort}`;
      
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) throw new Error(`PubMed ESearch failed with status: ${searchRes.status}`);
      const searchData = await searchRes.json();
      
      const pmids = searchData.esearchresult?.idlist;
      const total = parseInt(searchData.esearchresult?.count || '0', 10);
      
      setTotalResults(total);
      setCurrentPage(page);

      if (!pmids || pmids.length === 0) {
          setIsLoading(false);
          return;
      }

      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
      const summaryRes = await fetch(summaryUrl);
      if (!summaryRes.ok) throw new Error(`PubMed ESummary failed with status: ${summaryRes.status}`);
      const summaryData = await summaryRes.json();
      
      const parsedArticles: PubMedArticle[] = summaryData.result.uids.map((pmid: string) => {
        const articleData = summaryData.result[pmid];
        const doi = articleData.articleids.find((id: any) => id.idtype === 'doi')?.value;

        return {
          pmid,
          title: articleData.title,
          authors: articleData.authors.map((a: { name: string }) => a.name),
          journal: articleData.source,
          publishDate: articleData.pubdate,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          doi,
        };
      });
      setArticles(parsedArticles);
    } catch (err: any) {
      setError(err.message || 'Failed to search PubMed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchDrugsFda = async (query: string, page: number = 1, rpp: number = resultsPerPage) => {
    if (!query.trim()) {
        clearAllResults();
        return;
    }
    setIsLoading(true);
    setError(null);
    clearAllResults();

    try {
        const skip = (page - 1) * rpp;
        const searchFields = [
            'openfda.brand_name',
            'openfda.generic_name',
            'sponsor_name',
            'products.active_ingredients.name'
        ];
        const escapedQuery = query.replace(/"/g, '\\"');
        const luceneQuery = searchFields.map(field => `${field}:"${escapedQuery}"`).join(' OR ');
        const searchUrl = `https://api.fda.gov/drug/drugsfda.json?search=${encodeURIComponent(luceneQuery)}&limit=${rpp}&skip=${skip}`;
        
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) throw new Error(`Drugs@FDA search failed with status: ${searchRes.status}`);
        const searchData = await searchRes.json();
        
        const results = searchData.results;
        const total = searchData.meta.results.total;
        
        setTotalResults(total);
        setCurrentPage(page);

        if (!results || results.length === 0) {
            setIsLoading(false);
            return;
        }

        setDrugs(results as DrugFDAResult[]);
    } catch (err: any) {
        setError(err.message || 'Failed to search Drugs@FDA. Please try again.');
        console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchClinicalTrials = async (query: string, page: number = 1, rpp: number = resultsPerPage) => {
    if (!query.trim()) {
        clearAllResults();
        return;
    }
    setIsLoading(true);
    setError(null);
    clearAllResults();

    try {
        let searchUrl = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&pageSize=${rpp}`;
        if (page > 1 && trialPageTokens[page]) {
            searchUrl += `&pageToken=${trialPageTokens[page]}`;
        }
        
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) throw new Error(`ClinicalTrials.gov search failed: ${searchRes.statusText}`);
        const searchData = await searchRes.json();
        
        const results = searchData.studies;
        const total = searchData.totalCount;
        const nextPageToken = searchData.nextPageToken;

        setTotalResults(total);
        setCurrentPage(page);
        if (nextPageToken) {
            setTrialPageTokens(prev => ({ ...prev, [page + 1]: nextPageToken }));
        }

        if (!results || results.length === 0) {
            setIsLoading(false);
            return;
        }

        setTrials(results as ClinicalTrialResult[]);
    } catch (err: any) {
        setError(err.message || 'Failed to search ClinicalTrials.gov. Please try again.');
        console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUniProt = async (query: string, page: number = 1, rpp: number = resultsPerPage) => {
    if (!query.trim()) {
        clearAllResults();
        return;
    }
    setIsLoading(true);
    setError(null);
    clearAllResults();

    try {
        const offset = (page - 1) * rpp;
        const searchUrl = `https://rest.uniprot.org/uniprotkb/search?query=${encodeURIComponent(query)}&size=${rpp}&offset=${offset}`;
        
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) throw new Error(`UniProt search failed: ${searchRes.statusText}`);
        const total = parseInt(searchRes.headers.get('x-total-results') || '0', 10);
        const searchData = await searchRes.json();
        
        const results = searchData.results;
        
        setTotalResults(total);
        setCurrentPage(page);

        if (!results || results.length === 0) {
            setIsLoading(false);
            return;
        }

        setUniprotEntries(results as UniProtEntry[]);
    } catch (err: any) {
        setError(err.message || 'Failed to search UniProt. Please try again.');
        console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
};

  const handleArticleSelect = async (article: PubMedArticle) => {
    if (selectedArticle?.pmid === article.pmid && selectedArticle.abstract) {
      return;
    }
    setSelectedArticle(article);
    setSelectedDrug(null);
    setSelectedTrial(null);
    setSelectedUniprotEntry(null);
    setIsDetailLoading(true);
    setIsArticleInfoCollapsed(true);

    try {
      const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${article.pmid}&retmode=xml`;
      
      // Fetch main article details
      const efetchRes = await fetch(efetchUrl);
      if (!efetchRes.ok) throw new Error(`PubMed EFetch failed: ${efetchRes.statusText}`);
      
      const xmlText = await efetchRes.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      const articleNode = xmlDoc.querySelector('PubmedArticle');

      const abstractEls = Array.from(articleNode?.querySelectorAll('Abstract > AbstractText') || []);
      const abstract = abstractEls.map(el => {
          const label = el.getAttribute('Label');
          const text = el.textContent || '';
          return label ? `${label.toUpperCase()}\n${text}` : text;
      }).join('\n\n');

      const keywords = Array.from(articleNode?.querySelectorAll('MeshHeadingList > MeshHeading > DescriptorName') || [])
                            .map(kw => kw.textContent || '').filter(Boolean);
      
      const pmcNode = articleNode?.querySelector('PubmedData ArticleIdList ArticleId[IdType="pmc"]');
      const pmcId = pmcNode?.textContent;
      const pdfAvailable = !!pmcId;
      const pmcUrl = pmcId ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/` : undefined;

      const fullArticleData = { ...article, abstract, keywords, pdfAvailable, pmcUrl, citationCount: 0 };
      setSelectedArticle(fullArticleData);
      setIsDetailLoading(false);

      // Fetch citation count separately, so failure doesn't block main content
      try {
        const elinkUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&id=${article.pmid}&linkname=pubmed_pubmed_citedin&retmode=json`;
        const elinkRes = await fetch(elinkUrl);
        if (elinkRes.ok) {
          const elinkData = await elinkRes.json();
          const citationCount = elinkData.linksets?.[0]?.linksetdbs?.[0]?.links?.length ?? 0;
          setSelectedArticle(prev => prev ? { ...prev, citationCount } : null);
        } else {
            console.warn(`PubMed ELink (citations) failed with status: ${elinkRes.status}`);
        }
      } catch (elinkError) {
          console.warn('Could not fetch citation count:', elinkError);
      }

    } catch (err: any) {
      console.error('Failed to fetch article details', err);
      setSelectedArticle(prev => prev ? { ...prev, abstract: 'Failed to load abstract.', pdfAvailable: false, citationCount: 0 } : null);
      setIsDetailLoading(false);
    }
  };
  
  const handleDrugSelect = async (drug: DrugFDAResult) => {
    if (selectedDrug?.application_number === drug.application_number && selectedDrug.label_details) {
      return;
    }
    setSelectedDrug(drug);
    setSelectedArticle(null);
    setSelectedTrial(null);
    setSelectedUniprotEntry(null);
    setIsDetailLoading(true);
    setIsArticleInfoCollapsed(true);
    setIsDrugInfoCollapsed(true);

    try {
        const drugName = (drug.openfda?.brand_name?.[0] || drug.openfda?.generic_name?.[0]);
        if (!drugName) {
            throw new Error("No brand or generic name available for detailed search.");
        }
        
        const labelUrl = `https://api.fda.gov/drug/label.json?search=clinical_pharmacology:${encodeURIComponent(drugName)}`;
        
        const labelRes = await fetch(labelUrl);
        if (!labelRes.ok) throw new Error(`FDA Label API failed: ${labelRes.statusText}`);

        const labelData = await labelRes.json();
        const labelResult = labelData.results?.[0];

        if (!labelResult) {
            throw new Error("Label details not found using clinical pharmacology search.");
        }

        const label_details = {
            indications_and_usage: labelResult.indications_and_usage,
            warnings: labelResult.warnings,
            dosage_and_administration: labelResult.dosage_and_administration,
            description: labelResult.description,
            generic_name: labelResult.openfda?.generic_name,
            manufacturer_name: labelResult.openfda?.manufacturer_name,
            pharm_class_moa: labelResult.pharm_class_moa,
            route: labelResult.openfda?.route,
        };

        setSelectedDrug(prev => prev ? { ...prev, label_details } : null);

    } catch (err: any) {
      console.error('Failed to fetch drug label details', err);
      setSelectedDrug(prev => prev ? { ...prev, label_details: { description: [`Failed to load details. Error: ${err.message}`] } } : null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleTrialSelect = (trial: ClinicalTrialResult) => {
    setSelectedTrial(trial);
    setSelectedArticle(null);
    setSelectedDrug(null);
    setSelectedUniprotEntry(null);
    setIsCriteriaCollapsed(true);
  };

  const handleUniprotSelect = async (entry: UniProtEntry) => {
    if (selectedUniprotEntry?.primaryAccession === entry.primaryAccession && selectedUniprotEntry.sequence) {
      return;
    }
    setSelectedUniprotEntry(entry);
    setSelectedArticle(null);
    setSelectedDrug(null);
    setSelectedTrial(null);
    setIsDetailLoading(true);

    try {
        const response = await fetch(`https://rest.uniprot.org/uniprotkb/${entry.primaryAccession}.json`);
        if (!response.ok) {
            throw new Error(`UniProt details fetch failed: ${response.statusText}`);
        }
        const fullEntryData: UniProtEntry = await response.json();
        setSelectedUniprotEntry(prev => ({ ...prev, ...fullEntryData }));
    } catch (err: any) {
        console.error('Failed to fetch UniProt entry details', err);
        setSelectedUniprotEntry(prev => prev ? { ...prev, sequence: { value: `Error loading details: ${err.message}`, length: 0, molWeight: 0 } } : null);
    } finally {
        setIsDetailLoading(false);
    }
  };

  const handleCloseDetailPanel = () => {
    setSelectedArticle(null);
    setSelectedDrug(null);
    setSelectedTrial(null);
    setSelectedUniprotEntry(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSource === 'pubmed') {
        searchPubMed(searchQuery, 1, resultsPerPage, sortBy);
    } else if (searchSource === 'drug') {
        searchDrugsFda(searchQuery, 1, resultsPerPage);
    } else if (searchSource === 'clinicaltrials') {
        setTrialPageTokens({ 1: '' });
        searchClinicalTrials(searchQuery, 1, resultsPerPage);
    } else if (searchSource === 'uniprot') {
        searchUniProt(searchQuery, 1, resultsPerPage);
    }
  };

  const handleSaveArticle = async (article: PubMedArticle) => {
    const isCurrentlySaved = savedArticles.has(article.pmid);

    // Get the .references file node, or create it if it doesn't exist.
    let referencesFile = fileTree.children?.find(node => node.name === '.references' && node.type === 'file');

    if (!referencesFile && !isCurrentlySaved) {
        // FIX: The 'addNode' function returns a promise, so it must be awaited to get the new FileNode.
        const newNode = await addNode(fileTree.id, '.references', 'file');
        referencesFile = newNode;
    } else if (!referencesFile && isCurrentlySaved) {
        console.error("Cannot unsave: .references file not found.");
        return;
    }

    if (!referencesFile) {
      console.error("Failed to create or find .references file.");
      return;
    }

    // Read existing saved articles
    let saved: PubMedArticle[] = [];
    if (referencesFile.content) {
        try {
            saved = JSON.parse(referencesFile.content);
        } catch (e) {
            console.error("Failed to parse .references file content:", e);
            saved = [];
        }
    }

    if (isCurrentlySaved) {
        // Unsave: Remove the article from the array
        saved = saved.filter(a => a.pmid !== article.pmid);
    } else {
        // Save: Add the article to the array
        if (!saved.some(a => a.pmid === article.pmid)) {
            // Make sure we have full article details
            let fullArticle = { ...article };
            if (!fullArticle.abstract) {
                try {
                    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${article.pmid}&retmode=xml`;
                    const efetchRes = await fetch(efetchUrl);
                    if (!efetchRes.ok) throw new Error(`PubMed EFetch failed: ${efetchRes.statusText}`);
                    const xmlText = await efetchRes.text();
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
                    const articleNode = xmlDoc.querySelector('PubmedArticle');
                    const abstractEls = Array.from(articleNode?.querySelectorAll('Abstract > AbstractText') || []);
                    fullArticle.abstract = abstractEls.map(el => {
                        const label = el.getAttribute('Label');
                        const text = el.textContent || '';
                        return label ? `${label.toUpperCase()}\n${text}` : text;
                    }).join('\n\n') || 'No abstract available.';
                } catch (e) {
                    console.error("Could not fetch full abstract for saving", e);
                    fullArticle.abstract = 'Abstract could not be loaded.';
                }
            }
            saved.push(fullArticle);
        }
    }

    // Write back to the file
    const newContent = JSON.stringify(saved, null, 2);
    await updateFileContentById(referencesFile.id, newContent);

    // Update local state for immediate UI feedback
    setSavedArticles(new Set(saved.map(a => a.pmid)));
};

  const handleResultsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRpp = parseInt(e.target.value, 10);
    setResultsPerPage(newRpp);
    if (searchQuery.trim()) {
      handleSearch(e);
    }
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSortBy(newSort);
    if (searchQuery.trim()) {
      searchPubMed(searchQuery, 1, resultsPerPage, newSort);
    }
  };
  
  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchSource(e.target.value as any);
    clearAllResults();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      if (searchSource === 'pubmed') {
        searchPubMed(searchQuery, newPage, resultsPerPage, sortBy);
      } else if (searchSource === 'drug') {
        searchDrugsFda(searchQuery, newPage, resultsPerPage);
      } else if (searchSource === 'clinicaltrials') {
        searchClinicalTrials(searchQuery, newPage, resultsPerPage);
      } else if (searchSource === 'uniprot') {
        searchUniProt(searchQuery, newPage, resultsPerPage);
      }
    }
  };

  const handleShowSaved = () => {
    setIsLoading(true);
    setViewMode('saved');
    clearAllResults();
    const referencesFile = fileTree.children?.find(node => node.name === '.references' && node.type === 'file');
    if (referencesFile && referencesFile.content) {
        try {
            const saved = JSON.parse(referencesFile.content);
            setArticles(saved);
            setTotalResults(saved.length);
        } catch (e) {
            setArticles([]);
            setTotalResults(0);
            setError("Could not read saved articles. The file might be corrupted.");
        }
    } else {
        setArticles([]);
        setTotalResults(0);
    }
    setIsLoading(false);
  };

  const handleBackToSearch = () => {
      setViewMode('search');
      clearAllResults();
      setSearchQuery('');
  };

  const totalPages = viewMode === 'saved' ? Math.ceil(totalResults / resultsPerPage) : Math.ceil(totalResults / resultsPerPage);

  const getLatestSubmissionDate = (submissions: any[]) => {
      if (!submissions || submissions.length === 0) return 'N/A';
      try {
        const latest = submissions
            .map(s => new Date(s.submission_status_date))
            .reduce((a, b) => a > b ? a : b);
        return format(latest, 'MMM d, yyyy');
      } catch (e) {
        return 'N/A';
      }
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage: number, endPage: number;

    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
        const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <nav aria-label="Article navigation" className="flex items-center justify-center space-x-2 mt-8">
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Previous
            </button>
            {startPage > 1 && (
                <>
                    <button onClick={() => handlePageChange(1)} className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50">1</button>
                    {startPage > 2 && <span className="text-gray-500 px-1">...</span>}
                </>
            )}
            {pageNumbers.map(page => (
                <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    disabled={searchSource === 'clinicaltrials' && !trialPageTokens[page]}
                    className={`px-3 py-1 text-sm font-medium border ${
                        currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                    aria-current={currentPage === page ? 'page' : undefined}
                >
                    {page}
                </button>
            ))}
            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className="text-gray-500 px-1">...</span>}
                    <button 
                        onClick={() => handlePageChange(totalPages)} 
                        disabled={searchSource === 'clinicaltrials'}
                        className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {totalPages}
                    </button>
                </>
            )}
            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || (searchSource === 'clinicaltrials' && !trialPageTokens[currentPage + 1])}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
            </button>
        </nav>
    );
  };

  const getPlaceholderText = () => {
      switch(searchSource) {
          case 'pubmed': return "Search for articles, authors, keywords...";
          case 'drug': return "Search for brand name, generic name, sponsor...";
          case 'clinicaltrials': return "Search for conditions, interventions, NCT numbers...";
          case 'uniprot': return "Search for protein, gene name, organism...";
          default: return "Search...";
      }
  }

  const anySelection = selectedArticle || selectedDrug || selectedTrial || selectedUniprotEntry;

  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
       <div className="p-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">
                {viewMode === 'saved' ? 'My Saved Articles' : 'Literature Search'}
            </h1>
            {viewMode === 'search' ? (
                <button onClick={handleShowSaved} className="text-sm font-medium text-blue-600 hover:underline">
                    My saved articles
                </button>
            ) : (
                <button onClick={handleBackToSearch} className="text-sm font-medium text-blue-600 hover:underline">
                    Back to search
                </button>
            )}
        </div>

        {viewMode === 'search' && (
            <form onSubmit={handleSearch}>
                <div className="flex items-center space-x-2">
                    <select
                        value={searchSource}
                        onChange={handleSourceChange}
                        className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-sm"
                        aria-label="Search source"
                    >
                        <option value="pubmed">PubMed</option>
                        <option value="drug">Drugs@FDA</option>
                        <option value="clinicaltrials">ClinicalTrials.gov</option>
                        <option value="uniprot">UniProt</option>
                    </select>
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={getPlaceholderText()}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        {...{
                            whileHover: { scale: 1.05 },
                            whileTap: { scale: 0.95 }
                        } as any}
                    >
                        Search
                    </motion.button>
                </div>
            </form>
        )}
       </div>
      <div className="flex-1 overflow-y-auto p-0">
        <div className="flex space-x-6">
          <div className={`transition-all duration-300 pl-6 pt-4 pb-6 ${anySelection ? 'w-[60%]' : 'w-full pr-6'}`}>
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 mb-6 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {!isLoading && totalResults > 0 && (
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing results <span className="font-semibold">{Math.min((currentPage - 1) * resultsPerPage + 1, totalResults)} - {Math.min(currentPage * resultsPerPage, totalResults)}</span> of <span className="font-semibold">{totalResults.toLocaleString()}</span>
                </p>
                <div className="flex items-center space-x-4">
                  {searchSource === 'pubmed' && viewMode === 'search' && (
                    <div>
                      <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
                      <select id="sort-by" value={sortBy} onChange={handleSortByChange} className="text-sm border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                        <option value="pubdate">Newest</option>
                        <option value="relevance">Relevance</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label htmlFor="results-per-page" className="text-sm font-medium text-gray-700 mr-2">Per page:</label>
                    <select id="results-per-page" value={resultsPerPage} onChange={handleResultsPerPageChange} className="text-sm border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <AnimatePresence>
                {(searchSource === 'pubmed' || viewMode === 'saved') && articles.map((article, index) => (
                    <motion.div
                      key={article.pmid}
                      onClick={() => handleArticleSelect(article)}
                      className={`bg-white border p-4 hover:shadow-md transition-all duration-300 cursor-pointer ${
                        selectedArticle?.pmid === article.pmid ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'
                      }`}
                      {...{
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: index * 0.05 }
                      } as any}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 leading-tight flex-1 pr-4">
                          {article.title}
                        </h3>
                        <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                          <motion.button
                            onClick={(e) => { e.stopPropagation(); handleSaveArticle(article); }}
                            className={`p-2 transition-colors ${
                              savedArticles.has(article.pmid)
                                ? 'text-yellow-500'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title={savedArticles.has(article.pmid) ? 'Remove from saved' : 'Save article'}
                            {...{ whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 } } as any}
                          >
                            <Star className={`w-5 h-5 ${savedArticles.has(article.pmid) ? 'fill-current' : ''}`} />
                          </motion.button>
                          <motion.a
                            href={article.url} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="View on PubMed"
                            {...{ whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 } } as any}
                          >
                            <ExternalLink className="w-5 h-5" />
                          </motion.a>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                          <div className="flex items-center space-x-1.5">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span>{article.authors.slice(0, 2).join(', ')}{article.authors.length > 2 && ' et al.'}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                              <BookOpen className="w-4 h-4 text-gray-400" />
                              <span className="truncate">{article.journal}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {article.publishDate && <span>{format(new Date(article.publishDate), 'MMM d, yyyy')}</span>}
                          </div>
                      </div>
                    </motion.div>
                  ))}
                {searchSource === 'drug' && viewMode === 'search' && drugs.map((drug, index) => (
                    <motion.div
                        key={drug.application_number + index}
                        onClick={() => handleDrugSelect(drug)}
                        className={`bg-white border p-4 hover:shadow-md transition-all duration-300 cursor-pointer ${
                            selectedDrug?.application_number === drug.application_number ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'
                        }`}
                        {...{
                            initial: { opacity: 0, y: 20 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: index * 0.05 }
                        } as any}
                        >
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-800 leading-tight flex-1 pr-4">
                            {(drug.openfda?.brand_name || [])[0] || (drug.openfda?.generic_name || [])[0] || 'Unknown Drug'}
                            </h3>
                            <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                            {drug.openfda?.spl_set_id?.[0] && (
                                <motion.a
                                    href={`https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${drug.openfda.spl_set_id[0]}`} target="_blank" rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="View on DailyMed"
                                    {...{ whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 } } as any}
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </motion.a>
                            )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                            <div className="flex items-center space-x-1.5">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span>{drug.sponsor_name}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{drug.application_number}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{getLatestSubmissionDate(drug.submissions)}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {searchSource === 'clinicaltrials' && viewMode === 'search' && trials.map((trial, index) => {
                    const idMod = trial.protocolSection.identificationModule;
                    const statusMod = trial.protocolSection.statusModule;
                    const sponsorMod = trial.protocolSection.sponsorCollaboratorsModule;
                    return (
                        <motion.div
                            key={idMod.nctId}
                            onClick={() => handleTrialSelect(trial)}
                            className={`bg-white border p-4 hover:shadow-md transition-all duration-300 cursor-pointer ${
                                selectedTrial?.protocolSection.identificationModule.nctId === idMod.nctId ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'
                            }`}
                            {...{
                                initial: { opacity: 0, y: 20 },
                                animate: { opacity: 1, y: 0 },
                                transition: { delay: index * 0.05 }
                            } as any}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-800 leading-tight flex-1 pr-4">
                                    {idMod.briefTitle || idMod.officialTitle}
                                </h3>
                                <motion.a
                                    href={`https://clinicaltrials.gov/study/${idMod.nctId}`} target="_blank" rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="View on ClinicalTrials.gov"
                                    {...{ whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 } } as any}
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </motion.a>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                <div className="flex items-center space-x-1.5 font-mono text-xs bg-gray-100 px-2 py-1">
                                    <span>{idMod.nctId}</span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                    <Building className="w-4 h-4 text-gray-400" />
                                    <span>{sponsorMod?.leadSponsor.name}</span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>{statusMod.overallStatus}</span>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
                {searchSource === 'uniprot' && viewMode === 'search' && uniprotEntries.map((entry, index) => (
                    <motion.div
                        key={entry.primaryAccession}
                        onClick={() => handleUniprotSelect(entry)}
                        className={`bg-white border p-4 hover:shadow-md transition-all duration-300 cursor-pointer ${
                            selectedUniprotEntry?.primaryAccession === entry.primaryAccession ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'
                        }`}
                        {...{
                            initial: { opacity: 0, y: 20 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: index * 0.05 }
                        } as any}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-800 leading-tight flex-1 pr-4">
                                {entry.proteinDescription?.recommendedName?.fullName?.value || entry.uniProtkbId}
                            </h3>
                            <motion.a
                                href={`https://www.uniprot.org/uniprotkb/${entry.primaryAccession}/entry`} target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                title="View on UniProt"
                                {...{ whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 } } as any}
                            >
                                <ExternalLink className="w-5 h-5" />
                            </motion.a>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                            <div className="flex items-center space-x-1.5 font-mono text-xs bg-gray-100 px-2 py-1">
                                <span>{entry.primaryAccession}</span>
                            </div>
                            {entry.genes?.[0]?.geneName?.value && (
                                <div className="flex items-center space-x-1.5">
                                    <Dna className="w-4 h-4 text-gray-400" />
                                    <span className="italic">{entry.genes[0].geneName.value}</span>
                                </div>
                            )}
                             <div className="flex items-center space-x-1.5">
                                <TestTube className="w-4 h-4 text-gray-400" />
                                <span>{entry.organism?.scientificName}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {!isLoading && totalPages > 1 && (
              renderPagination()
            )}
          </div>
          
          <AnimatePresence>
            {anySelection && (
              <motion.div 
                className="w-[40%]"
                {...{
                    initial: { opacity: 0, x: 20 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: 20 },
                    transition: { duration: 0, ease: 'easeInOut' }
                } as any}
              >
                <div className="sticky top-0 h-screen max-h-screen">
                  <div className="bg-white border-l border-gray-200 flex-1 flex flex-col h-full max-h-screen">
                    {selectedArticle && (
                      <>
                        <div className="p-4 border-b border-gray-200 flex justify-between items-start">
                          <h3 className="text-base font-semibold text-gray-900 pr-4 leading-tight">{selectedArticle.title}</h3>
                          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                              {!isDetailLoading && selectedArticle.pdfAvailable && selectedArticle.pmcUrl && (
                                  <motion.a
                                    href={selectedArticle.pmcUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 hover:bg-green-100 text-green-600"
                                    title="Full text available on PubMed Central"
                                    onClick={(e) => e.stopPropagation()}
                                    {...{ whileHover: { scale: 1.1 } } as any}
                                  >
                                    <FileText className="w-5 h-5" />
                                  </motion.a>
                              )}
                              {!isDetailLoading && selectedArticle.pdfAvailable === false && (
                                  <div className="p-1 text-gray-400 cursor-help" title="Full text not available">
                                    <FileText className="w-5 h-5" />
                                  </div>
                              )}
                              <button onClick={handleCloseDetailPanel} className="p-1 hover:bg-gray-100">
                                  <X className="w-5 h-5 text-gray-500" />
                              </button>
                          </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {isDetailLoading ? (
                             <div className="p-4 space-y-6 animate-pulse">
                                <div className="space-y-3">
                                    <div className="h-4 bg-gray-200 w-1/3"></div>
                                    <div className="h-3 bg-gray-200 w-full"></div>
                                    <div className="h-3 bg-gray-200 w-5/6"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-gray-200 w-1/4"></div>
                                    <div className="h-3 bg-gray-200 w-full"></div>
                                    <div className="h-3 bg-gray-200 w-full"></div>
                                    <div className="h-3 bg-gray-200 w-3/4"></div>
                                </div>
                            </div>
                          ) : (
                            <>
                                <div className="border-b border-gray-200">
                                    <button 
                                        onClick={() => setIsArticleInfoCollapsed(!isArticleInfoCollapsed)}
                                        className="w-full flex justify-between items-center text-left p-4 bg-gray-50 hover:bg-gray-100"
                                    >
                                        <h4 className="font-semibold text-gray-800 text-sm">Article Information</h4>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isArticleInfoCollapsed ? '' : 'rotate-180'}`} />
                                    </button>
                                    <AnimatePresence>
                                        {!isArticleInfoCollapsed && (
                                            <motion.div
                                                className="overflow-hidden"
                                                {...{
                                                    initial: { height: 0, opacity: 0 },
                                                    animate: { height: 'auto', opacity: 1 },
                                                    exit: { height: 0, opacity: 0 },
                                                    transition: { duration: 0.2 }
                                                } as any}
                                            >
                                                <div className="p-4 space-y-3 text-sm bg-gray-50">
                                                    <div>
                                                        <strong className="text-gray-600 block mb-1">Authors:</strong>
                                                        <p className="text-gray-500 leading-relaxed">{selectedArticle.authors.slice(0, 20).join(', ')}{selectedArticle.authors.length > 20 && ' et al.'}</p>
                                                    </div>
                                                    <div>
                                                        <strong className="text-gray-600">Journal:</strong>
                                                        <p className="text-gray-500 italic">{selectedArticle.journal}</p>
                                                    </div>
                                                    <div>
                                                        <strong className="text-gray-600">Published:</strong>
                                                        <p className="text-gray-500">{format(new Date(selectedArticle.publishDate), 'MMMM d, yyyy')}</p>
                                                    </div>
                                                    {selectedArticle.doi && (
                                                        <div>
                                                            <strong className="text-gray-600">DOI:</strong>
                                                            <a href={`https://doi.org/${selectedArticle.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center space-x-1 break-all">
                                                                <span>{selectedArticle.doi}</span>
                                                                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                                            </a>
                                                        </div>
                                                    )}
                                                    {selectedArticle.citationCount !== undefined && (
                                                        <div className="flex items-center space-x-2 pt-2">
                                                            <Quote className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                            <span className="text-gray-600">Cited by <strong className="text-gray-800">{selectedArticle.citationCount}</strong> publications</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="p-4">
                                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">Abstract</h4>
                                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedArticle.abstract || 'No abstract available.'}</p>
                                  
                                  {selectedArticle.keywords && selectedArticle.keywords.length > 0 && (
                                      <div className="mt-6">
                                          <h4 className="font-semibold text-gray-800 mb-3 text-sm">Keywords</h4>
                                          <div className="flex flex-wrap gap-2">
                                              {selectedArticle.keywords.map((kw, i) => <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium">{kw}</span>)}
                                          </div>
                                      </div>
                                  )}
                                </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                    {selectedDrug && (
                      <>
                        <div className="p-4 border-b border-gray-200 flex justify-between items-start">
                          <h3 className="text-base font-semibold text-gray-900 pr-4 leading-tight">{(selectedDrug.openfda?.brand_name || [])[0] || (selectedDrug.openfda?.generic_name || [])[0] || 'Drug Details'}</h3>
                          <button onClick={handleCloseDetailPanel} className="p-1 hover:bg-gray-100">
                            <X className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {isDetailLoading ? (
                            <div className="p-4 space-y-4 animate-pulse">
                                <div className="h-5 bg-gray-200 w-1/3 mb-4"></div>
                                <div className="space-y-3">
                                    <div className="flex items-start"><div className="w-4 h-4 bg-gray-200 mr-3 mt-1"></div><div className="w-full space-y-2"><div className="h-3 bg-gray-200 w-1/4"></div><div className="h-3 bg-gray-200 w-3/4"></div></div></div>
                                    <div className="flex items-start"><div className="w-4 h-4 bg-gray-200 mr-3 mt-1"></div><div className="w-full space-y-2"><div className="h-3 bg-gray-200 w-1/4"></div><div className="h-3 bg-gray-200 w-1/2"></div></div></div>
                                </div>
                                <div className="h-4 bg-gray-200 w-1/3 mt-6 mb-2"></div>
                                <div className="h-16 bg-gray-200"></div>
                            </div>
                          ) : (
                            <>
                                <div className="border-b border-gray-200">
                                    <button 
                                        onClick={() => setIsDrugInfoCollapsed(!isDrugInfoCollapsed)}
                                        className="w-full flex justify-between items-center text-left p-4 bg-gray-50 hover:bg-gray-100"
                                    >
                                        <h4 className="font-semibold text-gray-800 text-sm">Drug Information</h4>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDrugInfoCollapsed ? '' : 'rotate-180'}`} />
                                    </button>
                                    <AnimatePresence>
                                        {!isDrugInfoCollapsed && (
                                            <motion.div
                                                className="overflow-hidden"
                                                {...{
                                                    initial: { height: 0, opacity: 0 },
                                                    animate: { height: 'auto', opacity: 1 },
                                                    exit: { height: 0, opacity: 0 },
                                                    transition: { duration: 0.2 }
                                                } as any}
                                            >
                                                <div className="p-4 space-y-4 bg-gray-50">
                                                    <div className="flex items-start">
                                                        <Beaker className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <strong className="text-gray-600 block text-xs">Generic Name</strong>
                                                            <p className="text-gray-800 leading-snug">{selectedDrug.label_details?.generic_name?.join(', ') || selectedDrug.openfda?.generic_name?.join(', ') || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start">
                                                        <Building className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <strong className="text-gray-600 block text-xs">Manufacturer</strong>
                                                            <p className="text-gray-800 leading-snug">{selectedDrug.label_details?.manufacturer_name?.join(', ') || selectedDrug.openfda?.manufacturer_name?.join(', ') || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start">
                                                        <Route className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <strong className="text-gray-600 block text-xs">Route of Administration</strong>
                                                            <p className="text-gray-800 leading-snug">{selectedDrug.label_details?.route?.join(', ') || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start">
                                                        <Archive className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <strong className="text-gray-600 block text-xs">Total Submissions</strong>
                                                            <p className="text-gray-800 leading-snug">{selectedDrug.submissions?.length || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start">
                                                        <FlaskConical className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <strong className="text-gray-600 block text-xs">Active Ingredients</strong>
                                                            <p className="text-gray-800 leading-snug">
                                                                {selectedDrug.products?.[0]?.active_ingredients.map(ing => `${ing.name} (${ing.strength})`).join(', ') || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start">
                                                        <FileText className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <strong className="text-gray-600 block text-xs">Application Number</strong>
                                                            <p className="text-gray-800 leading-snug">{selectedDrug.application_number}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                
                                {selectedDrug.label_details?.indications_and_usage && (
                                    <div className="p-4">
                                        <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center"><ClipboardList className="w-4 h-4 mr-2 text-gray-400" />Indications & Usage</h4>
                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedDrug.label_details.indications_and_usage.join('\n\n')}</p>
                                    </div>
                                )}
                                {selectedDrug.label_details?.dosage_and_administration && (
                                    <div className="p-4 border-t border-gray-200">
                                        <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center"><ClipboardEdit className="w-4 h-4 mr-2 text-gray-400" />Dosage & Administration</h4>
                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedDrug.label_details.dosage_and_administration.join('\n\n')}</p>
                                    </div>
                                )}
                            </>
                          )}
                        </div>
                      </>
                    )}
                    {selectedTrial && (
                       <>
                        <div className="p-4 border-b border-gray-200 flex justify-between items-start">
                          <h3 className="text-base font-semibold text-gray-900 pr-4 leading-tight">{selectedTrial.protocolSection.identificationModule.briefTitle}</h3>
                          <button onClick={handleCloseDetailPanel} className="p-1 hover:bg-gray-100">
                            <X className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-800 text-sm">Brief Summary</h4>
                                <p className="text-gray-600 text-sm mt-1">{selectedTrial.protocolSection.descriptionModule.briefSummary}</p>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-800 text-sm mb-2">Study Details</h4>
                                <div className="space-y-2 text-sm">
                                    <p><strong className="text-gray-600">NCT ID:</strong> {selectedTrial.protocolSection.identificationModule.nctId}</p>
                                    <p><strong className="text-gray-600">Status:</strong> {selectedTrial.protocolSection.statusModule.overallStatus}</p>
                                    <p><strong className="text-gray-600">Conditions:</strong> {selectedTrial.protocolSection.conditionsModule?.conditions.join(', ')}</p>
                                    <p><strong className="text-gray-600">Study Type:</strong> {selectedTrial.protocolSection.designModule.studyType}</p>
                                    <p><strong className="text-gray-600">Phases:</strong> {selectedTrial.protocolSection.designModule.phases?.join(', ')}</p>
                                    <p><strong className="text-gray-600">Enrollment:</strong> {selectedTrial.protocolSection.designModule.enrollmentInfo.count}</p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <button 
                                    onClick={() => setIsCriteriaCollapsed(!isCriteriaCollapsed)}
                                    className="w-full flex justify-between items-center text-left"
                                >
                                    <h4 className="font-semibold text-gray-800 text-sm">Eligibility Criteria</h4>
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isCriteriaCollapsed ? '' : 'rotate-180'}`} />
                                </button>
                                <AnimatePresence>
                                {!isCriteriaCollapsed && (
                                    <motion.div
                                        className="overflow-hidden mt-2"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                    >
                                        <div className="text-gray-600 text-sm whitespace-pre-wrap">{selectedTrial.protocolSection.eligibilityModule.eligibilityCriteria}</div>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </div>
                        </div>
                       </>
                    )}
                    {selectedUniprotEntry && (
                       <>
                        <div className="p-4 border-b border-gray-200 flex justify-between items-start">
                            <h3 className="text-base font-semibold text-gray-900 pr-4 leading-tight">{selectedUniprotEntry.proteinDescription?.recommendedName?.fullName?.value || selectedUniprotEntry.uniProtkbId}</h3>
                            <button onClick={handleCloseDetailPanel} className="p-1 hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 space-y-4">
                            {isDetailLoading ? (
                                <div className="p-4 space-y-4 animate-pulse">
                                    <div className="h-4 bg-gray-200 w-1/3"></div>
                                    <div className="h-3 bg-gray-200 w-3/4"></div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Accession</p>
                                        <p className="font-mono text-sm">{selectedUniprotEntry.primaryAccession}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Gene</p>
                                        <p className="text-sm italic">{selectedUniprotEntry.genes?.[0]?.geneName?.value || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Organism</p>
                                        <p className="text-sm italic">{selectedUniprotEntry.organism?.scientificName}</p>
                                    </div>
                                    {selectedUniprotEntry.sequence && (
                                        <div className="border-t pt-4">
                                            <h4 className="font-semibold text-gray-800 text-sm mb-2">Sequence ({selectedUniprotEntry.sequence.length} aa)</h4>
                                            <p className="font-mono text-xs break-all leading-relaxed bg-gray-50 p-2">{selectedUniprotEntry.sequence.value}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                       </> 
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}