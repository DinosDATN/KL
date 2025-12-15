import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  
  footerLinks = {
    platform: {
      title: 'Nền tảng',
      links: [
        { label: 'Về chúng tôi', href: '/about' },
        { label: 'Tính năng', href: '/features' },
        { label: 'Bảng giá', href: '/pricing' },
        { label: 'Liên hệ', href: '/contact' }
      ]
    },
    learning: {
      title: 'Học tập',
      links: [
        { label: 'Khóa học', href: '/courses' },
        { label: 'Bài tập', href: '/problems' },
        { label: 'Tài liệu', href: '/documents' },
        { label: 'Lộ trình', href: '/roadmap' }
      ]
    },
    community: {
      title: 'Cộng đồng',
      links: [
        { label: 'Diễn đàn', href: '/forum' },
        { label: 'Blog', href: '/blog' },
        { label: 'Sự kiện', href: '/events' },
        { label: 'Newsletter', href: '/newsletter' }
      ]
    },
    support: {
      title: 'Hỗ trợ',
      links: [
        { label: 'Trung tâm trợ giúp', href: '/contact' },
        { label: 'FAQ', href: '/contact' },
        { label: 'Báo lỗi', href: '/contact' },
        { label: 'Yêu cầu tính năng', href: '/contact' }
      ]
    }
  };
  
  socialLinks = [
    { name: 'Facebook', href: 'https://facebook.com', icon: 'facebook' },
    { name: 'Twitter', href: 'https://twitter.com', icon: 'twitter' },
    { name: 'LinkedIn', href: 'https://linkedin.com', icon: 'linkedin' },
    { name: 'GitHub', href: 'https://github.com', icon: 'github' },
    { name: 'YouTube', href: 'https://youtube.com', icon: 'youtube' }
  ];
}
