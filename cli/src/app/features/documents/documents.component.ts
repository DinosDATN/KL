import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  Document, 
  DocumentCategory, 
  DocumentCategoryLink,
  Topic 
} from '../../core/models/document.model';
import { 
  mockDocuments, 
  mockDocumentCategories, 
  mockDocumentCategoryLinks,
  mockTopics 
} from '../../core/services/document-mock-data';
import { ThemeService } from '../../core/services/theme.service';
import { DocumentCardComponent } from './components/document-card.component';
import { DocumentFiltersComponent, DocumentFilters } from './components/document-filters.component';
import { DocumentsPaginationComponent } from './components/documents-pagination.component';
import { DocumentsBannerComponent } from './components/documents-banner.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    DocumentCardComponent, 
    DocumentFiltersComponent, 
    DocumentsPaginationComponent,
    DocumentsBannerComponent
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent implements OnInit {
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  categories: DocumentCategory[] = [];
  topics: Topic[] = [];
  categoryLinks: DocumentCategoryLink[] = [];
  
  // Search term for top search bar
  topSearchTerm: string = '';
  
  // Filter and search properties
  filters: DocumentFilters = {
    searchTerm: '',
    selectedCategory: null,
    selectedTopic: null,
    selectedLevel: '',
    sortBy: 'title'
  };
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 0;
  
  // Loading state
  loading: boolean = false;
  
  // Mobile filter state
  mobileFiltersOpen: boolean = false;
  
  // Expose Math to template
  Math = Math;
  
  constructor(
    public themeService: ThemeService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadData();
  }
  
  private loadData(): void {
    this.loading = true;
    
    // Simulate API call delay
    setTimeout(() => {
      this.documents = mockDocuments.filter(doc => !doc.is_deleted);
      this.categories = mockDocumentCategories;
      this.topics = mockTopics;
      this.categoryLinks = mockDocumentCategoryLinks;
      this.applyFilters();
      this.loading = false;
    }, 500);
  }
  
  onTopSearchChange(): void {
    this.filters.searchTerm = this.topSearchTerm;
    this.currentPage = 1; // Reset to first page
    this.applyFilters();
  }
  
  applyFilters(): void {
    let filtered = [...this.documents];
    
    // Enhanced search filter - search across multiple fields
    if (this.filters.searchTerm.trim()) {
      const term = this.filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(doc => {
        // Get topic name for search
        const topicName = this.getTopicName(doc.topic_id).toLowerCase();
        // Get category names for search
        const categoryNames = this.getCategoryNames(doc.id).map(name => name.toLowerCase());
        
        return doc.title.toLowerCase().includes(term) ||
               (doc.description && doc.description.toLowerCase().includes(term)) ||
               topicName.includes(term) ||
               categoryNames.some(name => name.includes(term)) ||
               doc.level.toLowerCase().includes(term) ||
               (doc.content && doc.content.toLowerCase().includes(term));
      });
    }
    
    // Topic filter
    if (this.filters.selectedTopic !== null) {
      filtered = filtered.filter(doc => doc.topic_id === this.filters.selectedTopic);
    }
    
    // Category filter
    if (this.filters.selectedCategory !== null) {
      const documentsInCategory = this.categoryLinks
        .filter(link => link.category_id === this.filters.selectedCategory)
        .map(link => link.document_id);
      filtered = filtered.filter(doc => documentsInCategory.includes(doc.id));
    }
    
    // Level filter
    if (this.filters.selectedLevel) {
      filtered = filtered.filter(doc => doc.level === this.filters.selectedLevel);
    }
    
    // Sort
    filtered = this.sortDocuments(filtered, this.filters.sortBy);
    
    this.filteredDocuments = filtered;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    
    // Keep current page within valid range
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }
  
  private sortDocuments(documents: Document[], sortBy: string): Document[] {
    return documents.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rating':
          return b.rating - a.rating;
        case 'students':
          return b.students - a.students;
        case 'duration':
          return (a.duration || 0) - (b.duration || 0);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }
  
  get paginatedDocuments(): Document[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredDocuments.slice(start, end);
  }
  
  onFiltersChange(newFilters: DocumentFilters): void {
    this.filters = { ...newFilters };
    this.topSearchTerm = this.filters.searchTerm;
    this.applyFilters();
  }
  
  onClearFilters(): void {
    this.filters = {
      searchTerm: '',
      selectedCategory: null,
      selectedTopic: null,
      selectedLevel: '',
      sortBy: 'title'
    };
    this.topSearchTerm = '';
    this.applyFilters();
  }
  
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  onItemsPerPageChange(newItemsPerPage: number): void {
    this.itemsPerPage = newItemsPerPage;
    this.totalPages = Math.ceil(this.filteredDocuments.length / this.itemsPerPage);
    this.currentPage = 1; // Reset to first page
  }
  
  getTopicName(topicId: number): string {
    const topic = this.topics.find(t => t.id === topicId);
    return topic ? topic.name : 'Unknown Topic';
  }
  
  getCategoryNames(documentId: number): string[] {
    const categoryIds = this.categoryLinks
      .filter(link => link.document_id === documentId)
      .map(link => link.category_id);
    
    return categoryIds.map(id => {
      const category = this.categories.find(c => c.id === id);
      return category ? category.name : 'Unknown Category';
    });
  }
  
  onDocumentView(document: Document): void {
    // Navigate to document detail page
    console.log('Viewing document:', document);
    this.router.navigate(['/documents', document.id]);
  }
  
  toggleMobileFilters(): void {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  }
  
  closeMobileFilters(): void {
    this.mobileFiltersOpen = false;
  }
  
  trackByDocumentId(index: number, document: Document): number {
    return document.id;
  }
  
  // Top search methods
  clearTopSearch(): void {
    this.topSearchTerm = '';
    this.filters.searchTerm = '';
    this.currentPage = 1;
    this.applyFilters();
  }
}
