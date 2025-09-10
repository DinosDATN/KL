import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Input() isMobile = false;
  
  quickLinks = [
    { label: 'Bắt đầu học', link: '/getting-started', icon: 'play-circle', color: 'text-green-600' },
    { label: 'Lộ trình học tập', link: '/learning-path', icon: 'map', color: 'text-blue-600' },
    { label: 'Bài tập hôm nay', link: '/daily-challenge', icon: 'calendar', color: 'text-purple-600' },
    { label: 'Tiến độ của tôi', link: '/progress', icon: 'trending-up', color: 'text-orange-600' }
  ];
  
  categories = [
    {
      title: 'Ngôn ngữ lập trình',
      items: [
        { label: 'JavaScript', link: '/courses/javascript', count: 25 },
        { label: 'Python', link: '/courses/python', count: 30 },
        { label: 'Java', link: '/courses/java', count: 20 },
        { label: 'C++', link: '/courses/cpp', count: 15 },
        { label: 'PHP', link: '/courses/php', count: 18 }
      ]
    },
    {
      title: 'Công nghệ Web',
      items: [
        { label: 'React', link: '/courses/react', count: 22 },
        { label: 'Angular', link: '/courses/angular', count: 18 },
        { label: 'Vue.js', link: '/courses/vue', count: 16 },
        { label: 'Node.js', link: '/courses/nodejs', count: 20 }
      ]
    },
    {
      title: 'Cơ sở dữ liệu',
      items: [
        { label: 'MySQL', link: '/courses/mysql', count: 12 },
        { label: 'PostgreSQL', link: '/courses/postgresql', count: 10 },
        { label: 'MongoDB', link: '/courses/mongodb', count: 8 }
      ]
    }
  ];
  
  recentActivity = [
    { title: 'Lập trình Python cơ bản', progress: 75, type: 'course' },
    { title: 'Tìm số lớn thứ hai', progress: 100, type: 'problem' },
    { title: 'Thuật toán sắp xếp', progress: 45, type: 'document' }
  ];
}
