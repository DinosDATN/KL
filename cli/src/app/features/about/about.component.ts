import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  skills: string[];
  social?: {
    github?: string;
    linkedin?: string;
    email?: string;
  };
}

interface Milestone {
  year: string;
  title: string;
  description: string;
  icon: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}



@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit {



  // Platform features
  features: Feature[] = [
    {
      icon: 'monitor',
      title: 'Học tập trực tuyến',
      description: 'Nền tảng học tập hiện đại với video chất lượng cao, bài tập thực hành và hệ thống theo dõi tiến độ.'
    },
    {
      icon: 'users',
      title: 'Cộng đồng học tập',
      description: 'Kết nối với hàng nghìn lập trình viên, chia sẻ kinh nghiệm và học hỏi lẫn nhau.'
    },
    {
      icon: 'award',
      title: 'Chứng chỉ uy tín',
      description: 'Nhận chứng chỉ được công nhận bởi các doanh nghiệp hàng đầu trong ngành công nghệ.'
    },
    {
      icon: 'clock',
      title: 'Học mọi lúc mọi nơi',
      description: 'Truy cập khóa học 24/7 trên mọi thiết bị, học theo tốc độ phù hợp với bạn.'
    },
    {
      icon: 'trending-up',
      title: 'Cập nhật liên tục',
      description: 'Nội dung khóa học được cập nhật thường xuyên theo xu hướng công nghệ mới nhất.'
    },
    {
      icon: 'headphones',
      title: 'Hỗ trợ 24/7',
      description: 'Đội ngũ hỗ trợ chuyên nghiệp sẵn sàng giải đáp mọi thắc mắc của bạn.'
    }
  ];

  // Company milestones
  milestones: Milestone[] = [
    {
      year: '2020',
      title: 'Thành lập L-FYS',
      description: 'Ra mắt với sứ mệnh democratize việc học lập trình tại Việt Nam.',
      icon: 'rocket'
    },
    {
      year: '2021',
      title: 'Mở rộng khóa học',
      description: 'Phát triển hơn 100 khóa học về các ngôn ngữ lập trình phổ biến.',
      icon: 'book-open'
    },
    {
      year: '2022',
      title: 'Cộng đồng 5,000+',
      description: 'Đạt mốc 5,000 học viên và xây dựng cộng đồng học tập sôi động.',
      icon: 'users'
    },
    {
      year: '2023',
      title: 'Đối tác doanh nghiệp',
      description: 'Hợp tác với các công ty công nghệ hàng đầu để cung cấp chương trình đào tạo.',
      icon: 'briefcase'
    },
    {
      year: '2024',
      title: 'Nền tảng AI',
      description: 'Tích hợp AI để cá nhân hóa trải nghiệm học tập và hỗ trợ học viên tốt hơn.',
      icon: 'cpu'
    }
  ];

  // Team members
  teamMembers: TeamMember[] = [
    {
      name: 'Nguyễn Văn A',
      role: 'CEO & Founder',
      avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=3b82f6&color=ffffff&size=200',
      bio: 'Với hơn 10 năm kinh nghiệm trong ngành công nghệ, anh A đã dẫn dắt L-FYS trở thành nền tảng học lập trình hàng đầu Việt Nam.',
      skills: ['Leadership', 'Product Strategy', 'Business Development'],
      social: {
        linkedin: 'https://linkedin.com',
        email: 'ceo@l-fys.com'
      }
    },
    {
      name: 'Trần Thị B',
      role: 'CTO',
      avatar: 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=8b5cf6&color=ffffff&size=200',
      bio: 'Chuyên gia công nghệ với kinh nghiệm phát triển các hệ thống quy mô lớn, đảm bảo nền tảng L-FYS luôn ổn định và hiệu quả.',
      skills: ['System Architecture', 'Cloud Computing', 'DevOps'],
      social: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        email: 'cto@l-fys.com'
      }
    },
    {
      name: 'Lê Văn C',
      role: 'Head of Education',
      avatar: 'https://ui-avatars.com/api/?name=Le+Van+C&background=10b981&color=ffffff&size=200',
      bio: 'Giảng viên kỳ cựu với đam mê giáo dục, chịu trách nhiệm phát triển chương trình học và đảm bảo chất lượng nội dung.',
      skills: ['Curriculum Design', 'Educational Technology', 'Content Creation'],
      social: {
        linkedin: 'https://linkedin.com',
        email: 'education@l-fys.com'
      }
    },
    {
      name: 'Phạm Thị D',
      role: 'Head of Community',
      avatar: 'https://ui-avatars.com/api/?name=Pham+Thi+D&background=f59e0b&color=ffffff&size=200',
      bio: 'Chuyên gia xây dựng cộng đồng, tạo ra môi trường học tập tích cực và hỗ trợ học viên phát triển kỹ năng.',
      skills: ['Community Building', 'Event Management', 'Student Success'],
      social: {
        linkedin: 'https://linkedin.com',
        email: 'community@l-fys.com'
      }
    }
  ];

  // Company values
  values = [
    {
      title: 'Chất lượng',
      description: 'Cam kết cung cấp nội dung học tập chất lượng cao, được cập nhật liên tục theo xu hướng công nghệ.',
      icon: 'shield-check'
    },
    {
      title: 'Cộng đồng',
      description: 'Xây dựng cộng đồng học tập tích cực, nơi mọi người cùng nhau phát triển và chia sẻ kiến thức.',
      icon: 'heart'
    },
    {
      title: 'Đổi mới',
      description: 'Không ngừng đổi mới phương pháp giảng dạy và công nghệ để mang lại trải nghiệm học tập tốt nhất.',
      icon: 'lightbulb'
    },
    {
      title: 'Tiếp cận',
      description: 'Làm cho việc học lập trình trở nên dễ tiếp cận với mọi người, bất kể xuất thân hay trình độ.',
      icon: 'globe'
    }
  ];

  constructor(public themeService: ThemeService) {}

  ngOnInit(): void {
    // Component initialization
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}