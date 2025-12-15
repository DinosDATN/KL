import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemeService } from '../../../../core/services/theme.service';
import { ForumService, ForumCategory, CreatePostRequest } from '../../../../core/services/forum.service';
import { Subject, takeUntil } from 'rxjs';

interface PostTag {
  id: number;
  name: string;
  color: string;
}

@Component({
  selector: 'app-post-creator',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './post-creator.component.html',
  styleUrl: './post-creator.component.css'
})
export class PostCreatorComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() postCreated = new EventEmitter<CreatePostRequest>();

  private destroy$ = new Subject<void>();
  postForm: FormGroup;
  isSubmitting = false;
  showPreview = false;
  selectedFiles: File[] = [];
  
  // Editor state
  editorFocused = false;
  currentWordCount = 0;
  maxWordCount = 5000;

  // Available categories (loaded from service)
  categories: ForumCategory[] = [];

  // Available tags
  availableTags: PostTag[] = [
    { id: 1, name: 'JavaScript', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    { id: 2, name: 'TypeScript', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { id: 3, name: 'Angular', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    { id: 4, name: 'React', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
    { id: 5, name: 'Vue.js', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    { id: 6, name: 'Node.js', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    { id: 7, name: 'Python', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { id: 8, name: 'Java', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    { id: 9, name: 'CSS', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { id: 10, name: 'HTML', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    { id: 11, name: 'Backend', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
    { id: 12, name: 'Frontend', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    { id: 13, name: 'Mobile', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
    { id: 14, name: 'DevOps', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
    { id: 15, name: 'Database', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }
  ];

  selectedTags: PostTag[] = [];
  tagSearchTerm = '';
  showTagDropdown = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    public themeService: ThemeService,
    private forumService: ForumService
  ) {
    this.postForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(20)]],
      categoryId: [null, Validators.required],
      isQuestion: [false]
    });
  }

  ngOnInit(): void {
    // Load categories from service
    this.forumService.categories$
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.categories = categories;
      });

    // Subscribe to content changes for word count
    this.postForm.get('content')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(content => {
        this.currentWordCount = this.countWords(content || '');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  get filteredTags(): PostTag[] {
    if (!this.tagSearchTerm.trim()) {
      return this.availableTags.filter(tag => 
        !this.selectedTags.find(selected => selected.id === tag.id)
      );
    }
    return this.availableTags.filter(tag => 
      tag.name.toLowerCase().includes(this.tagSearchTerm.toLowerCase()) &&
      !this.selectedTags.find(selected => selected.id === tag.id)
    );
  }

  addTag(tag: PostTag): void {
    if (this.selectedTags.length < 5 && !this.selectedTags.find(t => t.id === tag.id)) {
      this.selectedTags.push(tag);
      this.tagSearchTerm = '';
      this.showTagDropdown = false;
    }
  }

  removeTag(tagId: number): void {
    this.selectedTags = this.selectedTags.filter(tag => tag.id !== tagId);
  }

  onFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const files = Array.from(target.files);
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      const validFiles = files.filter(file => {
        if (!allowedTypes.includes(file.type)) {
          this.showError(`File ${file.name} không được hỗ trợ. Chỉ chấp nhận: JPG, PNG, GIF, PDF, TXT`);
          return false;
        }
        if (file.size > maxSize) {
          this.showError(`File ${file.name} quá lớn. Kích thước tối đa: 5MB`);
          return false;
        }
        return true;
      });

      if (this.selectedFiles.length + validFiles.length > 5) {
        this.showError('Chỉ có thể tải lên tối đa 5 file');
        return;
      }

      this.selectedFiles = [...this.selectedFiles, ...validFiles];
      
      // Reset file input
      target.value = '';
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.startsWith('text/')) return '📝';
    return '📎';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  formatPreviewContent(content: string): string {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  }

  insertFormatting(type: string): void {
    const textarea = document.querySelector('#post-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let formattedText = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        formattedText = `**${selectedText || 'văn bản đậm'}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'văn bản nghiêng'}*`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'quote':
        formattedText = `> ${selectedText || 'trích dẫn'}`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'list':
        formattedText = `- ${selectedText || 'mục danh sách'}`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'link':
        formattedText = `[${selectedText || 'tiêu đề liên kết'}](url)`;
        cursorOffset = selectedText ? 0 : formattedText.length - 4;
        break;
    }

    const newText = text.substring(0, start) + formattedText + text.substring(end);
    this.postForm.patchValue({ content: newText });
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length - cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  onSubmit(): void {
    this.clearError();
    
    if (!this.postForm.valid) {
      this.markFormGroupTouched();
      this.showError('Vui lòng kiểm tra lại thông tin');
      return;
    }

    if (this.currentWordCount > this.maxWordCount) {
      this.showError(`Nội dung vượt quá giới hạn ${this.maxWordCount} từ`);
      return;
    }

    if (this.isSubmitting) return;

    this.isSubmitting = true;

    const formValue = this.postForm.value;
    const postRequest: CreatePostRequest = {
      categoryId: formValue.categoryId,
      title: formValue.title?.trim(),
      content: formValue.content?.trim(),
      isQuestion: formValue.isQuestion || false,
      tags: this.selectedTags.map(tag => tag.name) // Use tag names instead of IDs
    };

    // Call the real API
    this.forumService.createPost(postRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('Post created successfully:', result);
          this.postCreated.emit(postRequest);
          this.resetForm();
          this.isSubmitting = false;
          this.closeModal.emit();
        },
        error: (error) => {
          console.error('Error creating post:', error);
          this.showError('Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại.');
          this.isSubmitting = false;
        }
      });
  }

  resetForm(): void {
    this.postForm.reset();
    this.selectedTags = [];
    this.selectedFiles = [];
    this.showPreview = false;
    this.tagSearchTerm = '';
    this.showTagDropdown = false;
    this.currentWordCount = 0;
    this.errorMessage = '';
    this.editorFocused = false;
  }

  onClose(): void {
    if (this.postForm.dirty) {
      if (confirm('Bạn có chắc chắn muốn đóng? Nội dung chưa lưu sẽ bị mất.')) {
        this.resetForm();
        this.closeModal.emit();
      }
    } else {
      this.closeModal.emit();
    }
  }

  getCategoryById(id: number): ForumCategory | undefined {
    return this.categories.find(cat => cat.id === id);
  }

  showError(message: string): void {
    this.errorMessage = message;
    // Clear error after 5 seconds
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  clearError(): void {
    this.errorMessage = '';
  }

  markFormGroupTouched(): void {
    Object.keys(this.postForm.controls).forEach(key => {
      const control = this.postForm.get(key);
      control?.markAsTouched();
    });
  }
}
