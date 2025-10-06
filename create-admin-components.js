const fs = require('fs');
const path = require('path');

const components = [
  {
    name: 'user-reports',
    title: 'User Reports',
    description: 'Generate comprehensive reports about user activities, registrations, and platform usage.',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    name: 'document-management',
    title: 'Document Management',
    description: 'Manage learning documents, tutorials, and educational content across the platform.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    name: 'problem-management',
    title: 'Problem Management',
    description: 'Create, edit, and manage coding problems and challenges for users to solve.',
    icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
  },
  {
    name: 'contest-management',
    title: 'Contest Management',
    description: 'Organize and manage programming contests, competitions, and leaderboards.',
    icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
  },
  {
    name: 'contest-analytics',
    title: 'Contest Analytics',
    description: 'Analyze contest performance, participation metrics, and competitive programming statistics.',
    icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
  },
  {
    name: 'platform-analytics',
    title: 'Platform Analytics',
    description: 'Comprehensive platform performance metrics, usage statistics, and growth analysis.',
    icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z'
  },
  {
    name: 'engagement-analytics',
    title: 'Engagement Analytics',
    description: 'Track user engagement patterns, session duration, and feature adoption rates.',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
  },
  {
    name: 'revenue-reports',
    title: 'Revenue Reports',
    description: 'Financial analytics including subscription revenue, course sales, and payment tracking.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  {
    name: 'system-settings',
    title: 'System Settings',
    description: 'Configure system-wide settings, application preferences, and platform configuration.',
    icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4'
  },
  {
    name: 'system-logs',
    title: 'System Logs',
    description: 'View and analyze system logs, error reports, and application monitoring data.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    name: 'system-backups',
    title: 'System Backups',
    description: 'Manage data backups, system restoration, and data integrity monitoring.',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
  }
];

const basePath = 'E:\\AA\\KLTN\\KL\\cli\\src\\app\\features\\admin';

components.forEach(component => {
  const componentDir = path.join(basePath, component.name);
  const componentFile = path.join(componentDir, `${component.name}.component.ts`);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
    console.log(`Created directory: ${componentDir}`);
  }
  
  // Generate component class name
  const className = component.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Component';
  
  const componentContent = `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-${component.name}',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div class="p-6">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">${component.title}</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">${component.description}</p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div class="max-w-md mx-auto">
          <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${component.icon}"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">${component.title}</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">${component.description}</p>
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p class="text-sm text-blue-700 dark:text-blue-300">🚧 This feature is currently under development and will be available in the next update.</p>
          </div>
        </div>
      </div>
    </div>
  \`
})
export class ${className} {}`;

  // Write component file
  fs.writeFileSync(componentFile, componentContent);
  console.log(`Created component: ${componentFile}`);
});

console.log('All admin placeholder components created successfully!');