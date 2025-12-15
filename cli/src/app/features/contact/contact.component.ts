import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemeService } from '../../core/services/theme.service';
import { ContactService, ContactFormData } from '../../core/services/contact.service';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  // Contact categories
  categories = [
    { value: 'general', label: 'Câu hỏi chung' },
    { value: 'technical', label: 'Hỗ trợ kỹ thuật' },
    { value: 'course', label: 'Khóa học' },
    { value: 'payment', label: 'Thanh toán' },
    { value: 'account', label: 'Tài khoản' },
    { value: 'bug', label: 'Báo lỗi' },
    { value: 'feature', label: 'Đề xuất tính năng' },
    { value: 'other', label: 'Khác' }
  ];

  // FAQ data
  faqs: FAQ[] = [
    {
      question: 'Làm thế nào để đăng ký khóa học?',
      answer: 'Bạn có thể đăng ký khóa học bằng cách truy cập trang Khóa học, chọn khóa học mong muốn và nhấn "Đăng ký". Sau đó làm theo hướng dẫn thanh toán.',
      category: 'course'
    },
    {
      question: 'Tôi quên mật khẩu, làm sao để lấy lại?',
      answer: 'Truy cập trang đăng nhập và nhấn "Quên mật khẩu". Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.',
      category: 'account'
    },
    {
      question: 'Các phương thức thanh toán nào được hỗ trợ?',
      answer: 'Chúng tôi hỗ trợ thanh toán qua VNPay, chuyển khoản ngân hàng và các ví điện tử phổ biến tại Việt Nam.',
      category: 'payment'
    },
    {
      question: 'Tôi gặp lỗi khi xem video bài học?',
      answer: 'Hãy thử làm mới trang, kiểm tra kết nối internet hoặc thử trình duyệt khác. Nếu vẫn gặp vấn đề, vui lòng liên hệ hỗ trợ kỹ thuật.',
      category: 'technical'
    },
    {
      question: 'Làm thế nào để tham gia cộng đồng học tập?',
      answer: 'Sau khi đăng ký tài khoản, bạn có thể tham gia Forum, Chat với các học viên khác và tham gia các cuộc thi lập trình.',
      category: 'general'
    },
    {
      question: 'Tôi có thể hủy khóa học và hoàn tiền không?',
      answer: 'Bạn có thể hủy khóa học trong vòng 7 ngày đầu tiên và được hoàn tiền 100% nếu chưa hoàn thành quá 20% khóa học.',
      category: 'course'
    }
  ];

  // Contact info
  contactInfo = {
    email: 'support@l-fys.com',
    phone: '+84 123 456 789',
    address: 'Hà Nội, Việt Nam',
    hours: 'Thứ 2 - Thứ 6: 8:00 - 18:00'
  };

  constructor(
    private fb: FormBuilder,
    public themeService: ThemeService,
    private contactService: ContactService
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      category: ['general', Validators.required]
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  onSubmit(): void {
    if (this.contactForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.submitError = '';

      const formData: ContactFormData = this.contactForm.value;

      this.contactService.sendContactForm(formData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.submitSuccess = true;
            this.contactForm.reset();
            this.contactForm.patchValue({ category: 'general' });

            // Hide success message after 5 seconds
            setTimeout(() => {
              this.submitSuccess = false;
            }, 5000);
          } else {
            this.submitError = response.message || 'Có lỗi xảy ra khi gửi tin nhắn';
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Contact form error:', error);
          
          if (error.status === 400 && error.error?.errors) {
            // Handle validation errors
            const validationErrors = error.error.errors.map((err: any) => err.msg).join(', ');
            this.submitError = `Dữ liệu không hợp lệ: ${validationErrors}`;
          } else if (error.status === 429) {
            this.submitError = 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.';
          } else if (error.error?.message) {
            this.submitError = error.error.message;
          } else {
            this.submitError = 'Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.';
          }
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Trường này là bắt buộc';
      }
      if (field.errors['email']) {
        return 'Email không hợp lệ';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Tối thiểu ${requiredLength} ký tự`;
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  getFilteredFAQs(category?: string): FAQ[] {
    if (!category) {
      return this.faqs;
    }
    return this.faqs.filter(faq => faq.category === category);
  }

  getCategoryLabel(categoryValue: string): string {
    const category = this.categories.find(c => c.value === categoryValue);
    return category ? category.label : categoryValue;
  }
}