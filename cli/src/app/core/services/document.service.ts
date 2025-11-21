import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, retry, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Document,
  DocumentCategory,
  DocumentCategoryLink,
  DocumentModule,
  DocumentLesson,
  DocumentCompletion,
  DocumentLessonCompletion,
  Animation,
  Topic,
} from '../models/document.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

interface DocumentFilters {
  page?: number;
  limit?: number;
  level?: string;
  topic_id?: number;
  category_id?: number;
  created_by?: number;
  search?: string;
  sortBy?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  // Get all documents with filtering and pagination
  getDocuments(filters: DocumentFilters = {}): Observable<{
    documents: Document[];
    pagination: any;
  }> {
    let params = new HttpParams();

    Object.keys(filters).forEach((key) => {
      const value = (filters as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    console.log('DocumentService: Fetching documents with filters:', filters);
    console.log('DocumentService: API URL:', this.apiUrl);

    return this.http.get<ApiResponse<Document[]>>(this.apiUrl, { params }).pipe(
      retry(2), // Retry failed requests up to 2 times
      map((response) => {
        console.log('DocumentService: Received documents response:', response);
        return {
          documents: response.data || [],
          pagination: response.pagination || {
            current_page: 1,
            total_pages: 1,
            total_items: 0,
            items_per_page: 10,
          },
        };
      }),
      catchError(this.handleError)
    );
  }

  // Get document by ID
  getDocumentById(id: number): Observable<Document> {
    return this.http.get<ApiResponse<Document>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data),
      catchError(this.handleError)
    );
  }

  // Get featured documents
  getFeaturedDocuments(limit: number = 6): Observable<Document[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http
      .get<ApiResponse<Document[]>>(`${this.apiUrl}/featured`, { params })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  // Get document details with modules, lessons, etc.
  getDocumentDetails(id: number): Observable<{
    document: Document;
    topic: Topic;
    creator: any;
    modules: DocumentModule[];
    lessons: DocumentLesson[];
    categories: DocumentCategory[];
    categoryLinks: DocumentCategoryLink[];
    animations: Animation[];
  }> {
    console.log('DocumentService: Fetching document details for ID:', id);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}/details`).pipe(
      map((response) => {
        console.log(
          'DocumentService: Received document details:',
          response.data
        );
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  // Get documents by topic
  getDocumentsByTopic(
    topicId: number,
    page: number = 1,
    limit: number = 10
  ): Observable<{
    documents: Document[];
    pagination: any;
  }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<ApiResponse<Document[]>>(`${this.apiUrl}/topic/${topicId}`, {
        params,
      })
      .pipe(
        map((response) => ({
          documents: response.data,
          pagination: response.pagination,
        })),
        catchError(this.handleError)
      );
  }

  // Get all topics
  getTopics(): Observable<Topic[]> {
    console.log(
      'DocumentService: Fetching topics from:',
      `${this.apiUrl}/topics`
    );
    return this.http.get<ApiResponse<Topic[]>>(`${this.apiUrl}/topics`).pipe(
      map((response) => {
        console.log('DocumentService: Received topics:', response.data);
        return response.data || [];
      }),
      catchError(this.handleError)
    );
  }

  // Get all document categories
  getDocumentCategories(): Observable<DocumentCategory[]> {
    console.log(
      'DocumentService: Fetching categories from:',
      `${this.apiUrl}/categories`
    );
    return this.http
      .get<ApiResponse<DocumentCategory[]>>(`${this.apiUrl}/categories`)
      .pipe(
        map((response) => {
          console.log('DocumentService: Received categories:', response.data);
          return response.data || [];
        }),
        catchError(this.handleError)
      );
  }

  // Get document category links
  getDocumentCategoryLinks(
    documentId?: number,
    categoryId?: number
  ): Observable<DocumentCategoryLink[]> {
    let params = new HttpParams();

    if (documentId) params = params.set('document_id', documentId.toString());
    if (categoryId) params = params.set('category_id', categoryId.toString());

    return this.http
      .get<ApiResponse<DocumentCategoryLink[]>>(
        `${this.apiUrl}/category-links`,
        { params }
      )
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  // Get document modules
  getDocumentModules(documentId: number): Observable<DocumentModule[]> {
    return this.http
      .get<ApiResponse<DocumentModule[]>>(
        `${this.apiUrl}/${documentId}/modules`
      )
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  // Get module lessons
  getModuleLessons(moduleId: number): Observable<DocumentLesson[]> {
    return this.http
      .get<ApiResponse<DocumentLesson[]>>(
        `${this.apiUrl}/modules/${moduleId}/lessons`
      )
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  // Create document module
  createDocumentModule(documentId: number, moduleData: { title: string; position: number }): Observable<DocumentModule> {
    return this.http
      .post<ApiResponse<DocumentModule>>(
        `${this.apiUrl}/${documentId}/modules`,
        moduleData
      )
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  // Create document lesson
  createDocumentLesson(moduleId: number, lessonData: { title: string; content?: string; code_example?: string; position: number }): Observable<DocumentLesson> {
    return this.http
      .post<ApiResponse<DocumentLesson>>(
        `${this.apiUrl}/modules/${moduleId}/lessons`,
        lessonData
      )
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  // Delete document module
  deleteDocumentModule(moduleId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(
        `${this.apiUrl}/modules/${moduleId}`
      )
      .pipe(
        map(() => void 0),
        catchError(this.handleError)
      );
  }

  // Delete document lesson
  deleteDocumentLesson(lessonId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(
        `${this.apiUrl}/lessons/${lessonId}`
      )
      .pipe(
        map(() => void 0),
        catchError(this.handleError)
      );
  }

  // Get document lessons
  getDocumentLessons(documentId: number): Observable<DocumentLesson[]> {
    return this.http
      .get<ApiResponse<DocumentLesson[]>>(
        `${this.apiUrl}/${documentId}/lessons`
      )
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  // Get lesson by ID
  getLessonById(lessonId: number): Observable<DocumentLesson> {
    return this.http
      .get<ApiResponse<DocumentLesson>>(`${this.apiUrl}/lessons/${lessonId}`)
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  // Get document animations
  getDocumentAnimations(documentId: number): Observable<Animation[]> {
    return this.http
      .get<ApiResponse<Animation[]>>(`${this.apiUrl}/${documentId}/animations`)
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  // Get lesson animations
  getLessonAnimations(lessonId: number): Observable<Animation[]> {
    return this.http
      .get<ApiResponse<Animation[]>>(
        `${this.apiUrl}/lessons/${lessonId}/animations`
      )
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  // Get user document completions
  getUserDocumentCompletions(userId: number): Observable<DocumentCompletion[]> {
    return this.http
      .get<ApiResponse<DocumentCompletion[]>>(
        `${this.apiUrl}/users/${userId}/completions`
      )
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  // Get user lesson completions
  getUserLessonCompletions(
    userId: number
  ): Observable<DocumentLessonCompletion[]> {
    return this.http
      .get<ApiResponse<DocumentLessonCompletion[]>>(
        `${this.apiUrl}/users/${userId}/lesson-completions`
      )
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  // Helper method to get category names for a document
  getCategoryNamesForDocument(documentId: number): Observable<string[]> {
    return this.getDocumentCategoryLinks(documentId).pipe(
      map((links) => {
        const categoryIds = links.map((link) => link.category_id);
        // This would need to be optimized in a real app to reduce HTTP calls
        // For now, we'll return empty array and handle this differently
        return [];
      }),
      catchError(this.handleError)
    );
  }

  // Helper method to get topic name
  getTopicName(topicId: number): Observable<string> {
    return this.getTopics().pipe(
      map((topics) => {
        const topic = topics.find((t) => t.id === topicId);
        return topic ? topic.name : 'Unknown Topic';
      }),
      catchError(this.handleError)
    );
  }

  // Optimized method to get all data needed for documents list
  getDocumentsWithRelatedData(filters: DocumentFilters = {}): Observable<{
    documents: Document[];
    topics: Topic[];
    categories: DocumentCategory[];
    categoryLinks: DocumentCategoryLink[];
    pagination: any;
  }> {
    // Get documents and related data in parallel
    const documents$ = this.getDocuments(filters);
    const topics$ = this.getTopics();
    const categories$ = this.getDocumentCategories();
    const categoryLinks$ = this.getDocumentCategoryLinks();

    // Use forkJoin to combine all requests
    return documents$.pipe(
      map((documentsResponse) => {
        // For simplicity, we'll make separate calls for now
        // In a production app, you might want to create a specialized endpoint
        // that returns all this data in one request
        return {
          documents: documentsResponse.documents,
          topics: [],
          categories: [],
          categoryLinks: [],
          pagination: documentsResponse.pagination,
        };
      }),
      catchError(this.handleError)
    );
  }

  // Error handling
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }

    console.error('Document service error:', errorMessage);
    console.error('Full error object:', error);

    // For connection errors, provide a more helpful message
    if (error.status === 0) {
      errorMessage =
        'Cannot connect to the backend API. Please ensure the server is running on ' +
        environment.apiUrl;
    }

    return throwError(() => new Error(errorMessage));
  }
}
