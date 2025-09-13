# 🧪 Testing Setup for Chat Room Creation Feature

## 📋 Overview

This document provides test setup instructions and sample test implementations for the chat room creation feature.

## 🛠️ Test Environment Setup

### Backend Testing (Node.js)

#### Install Test Dependencies
```bash
cd api
npm install --save-dev jest supertest
```

#### Jest Configuration (`api/jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/models/index.js',
    '!src/config/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

#### Test Database Setup (`api/tests/setup.js`)
```javascript
const { sequelize } = require('../src/config/sequelize');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
```

### Frontend Testing (Angular)

#### Angular Test Configuration
The existing Angular setup should already have Karma and Jasmine configured. Ensure these are in your `package.json`:

```json
{
  "devDependencies": {
    "@angular/testing": "^17.0.0",
    "jasmine": "~5.0.0",
    "karma": "~6.4.0",
    "karma-chrome-headless": "~3.1.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0"
  }
}
```

## 🧪 Sample Test Implementations

### Backend Tests

#### 1. Chat Controller Tests (`api/tests/controllers/chatController.test.js`)
```javascript
const request = require('supertest');
const app = require('../../src/app');
const { User, ChatRoom, ChatRoomMember } = require('../../src/models');
const jwt = require('jsonwebtoken');

describe('Chat Controller', () => {
  let authToken;
  let testUser;
  let otherUser;

  beforeEach(async () => {
    // Create test users
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      is_active: true
    });

    otherUser = await User.create({
      name: 'Other User',
      email: 'other@example.com',
      password: 'password123',
      is_active: true,
      is_online: true
    });

    // Generate auth token
    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);
  });

  afterEach(async () => {
    await ChatRoomMember.destroy({ where: {} });
    await ChatRoom.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('POST /api/v1/chat/rooms', () => {
    it('should create a new chat room', async () => {
      const roomData = {
        name: 'Test Room',
        description: 'Test Description',
        type: 'group',
        is_public: true,
        memberIds: [otherUser.id]
      };

      const response = await request(app)
        .post('/api/v1/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(roomData.name);
      expect(response.body.data.created_by).toBe(testUser.id);
    });

    it('should reject room creation without name', async () => {
      const roomData = {
        description: 'Test Description',
        memberIds: [otherUser.id]
      };

      const response = await request(app)
        .post('/api/v1/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/chat/users/search', () => {
    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/v1/chat/users/search?q=Other')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Other User');
    });

    it('should require minimum 2 characters', async () => {
      const response = await request(app)
        .get('/api/v1/chat/users/search?q=O')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should exclude current user from results', async () => {
      const response = await request(app)
        .get('/api/v1/chat/users/search?q=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/chat/users/online', () => {
    it('should return online users', async () => {
      const response = await request(app)
        .get('/api/v1/chat/users/online')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].is_online).toBe(true);
    });
  });

  describe('POST /api/v1/chat/rooms/validate-members', () => {
    it('should validate member IDs', async () => {
      const response = await request(app)
        .post('/api/v1/chat/rooms/validate-members')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ memberIds: [otherUser.id, 999] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.validMembers).toHaveLength(1);
      expect(response.body.data.invalidMembers).toHaveLength(1);
      expect(response.body.data.invalidMembers).toContain(999);
    });
  });
});
```

#### 2. Socket.IO Tests (`api/tests/socket/chatHandler.test.js`)
```javascript
const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const jwt = require('jsonwebtoken');
const { User, ChatRoom } = require('../../src/models');
const { handleConnection } = require('../../src/socket/chatHandler');

describe('Chat Socket Handler', () => {
  let io, serverSocket, clientSocket, testUser;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    handleConnection(io);
    
    httpServer.listen(() => {
      const port = httpServer.address().port;
      
      // Create test user
      User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        is_active: true
      }).then(user => {
        testUser = user;
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
        
        clientSocket = new Client(`http://localhost:${port}`, {
          auth: { token }
        });
        
        io.on('connection', (socket) => {
          serverSocket = socket;
        });
        
        clientSocket.on('connect', done);
      });
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  afterEach(async () => {
    await ChatRoom.destroy({ where: {} });
  });

  test('should create room via socket', (done) => {
    const roomData = {
      name: 'Socket Test Room',
      description: 'Test Description',
      type: 'group',
      isPublic: true,
      memberIds: []
    };

    clientSocket.emit('create_room', roomData);
    
    clientSocket.on('room_created', (data) => {
      expect(data.name).toBe(roomData.name);
      expect(data.created_by).toBe(testUser.id);
      done();
    });
  });

  test('should handle room creation errors', (done) => {
    const roomData = {
      // Missing name
      description: 'Test Description'
    };

    clientSocket.emit('create_room', roomData);
    
    clientSocket.on('error', (error) => {
      expect(error.message).toBe('Room name is required');
      done();
    });
  });
});
```

### Frontend Tests

#### 1. Chat Service Tests (`cli/src/app/core/services/chat.service.spec.ts`)
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChatService } from './chat.service';
import { SocketService } from './socket.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { User } from '../models/user.model';
import { ChatRoom } from '../models/chat.model';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;
  let socketServiceSpy: jasmine.SpyObj<SocketService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    const socketSpy = jasmine.createSpyObj('SocketService', [
      'connect', 'disconnect', 'joinRoom', 'createRoom'
    ], {
      newMessage$: of(null),
      userTyping$: of(null),
      userStopTyping$: of(null),
      reactionUpdate$: of(null),
      roomCreated$: of(null),
      userOnline$: of(null),
      userOffline$: of(null),
      notification$: of(null),
      error$: of(null)
    });

    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'getToken']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['info', 'success', 'error']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChatService,
        { provide: SocketService, useValue: socketSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: NotificationService, useValue: notificationSpy }
      ]
    });

    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
    socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    notificationServiceSpy = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('searchUsers', () => {
    it('should return empty array for short search terms', (done) => {
      service.searchUsers('a').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should search users via HTTP', (done) => {
      const mockUsers: User[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com' } as User
      ];

      service.searchUsers('john').subscribe(result => {
        expect(result).toEqual(mockUsers);
        done();
      });

      const req = httpMock.expectOne('/api/v1/chat/users/search?q=john');
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockUsers });
    });
  });

  describe('createRoomWithValidation', () => {
    it('should create room without members', (done) => {
      const roomData = { name: 'Test Room', is_public: true };
      const mockRoom: ChatRoom = { id: 1, name: 'Test Room' } as ChatRoom;

      service.createRoomWithValidation(roomData).subscribe(result => {
        expect(result.room).toEqual(mockRoom);
        expect(result.validMembers).toEqual([]);
        expect(result.invalidMembers).toEqual([]);
        done();
      });

      const req = httpMock.expectOne('/api/v1/chat/rooms');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: mockRoom });
    });

    it('should validate members before creating room', (done) => {
      const roomData = { name: 'Test Room', memberIds: [1, 2] };
      const validationResult = {
        validMembers: [{ id: 1, name: 'Valid User' }] as User[],
        invalidMembers: [2]
      };
      const mockRoom: ChatRoom = { id: 1, name: 'Test Room' } as ChatRoom;

      service.createRoomWithValidation(roomData).subscribe(result => {
        expect(result.validMembers).toEqual(validationResult.validMembers);
        expect(result.invalidMembers).toEqual(validationResult.invalidMembers);
        done();
      });

      // First request: validation
      const validateReq = httpMock.expectOne('/api/v1/chat/rooms/validate-members');
      validateReq.flush({ success: true, data: validationResult });

      // Second request: room creation
      const createReq = httpMock.expectOne('/api/v1/chat/rooms');
      createReq.flush({ success: true, data: mockRoom });
    });
  });
});
```

#### 2. Create Group Modal Tests (`cli/src/app/features/forum/components/create-group-modal/create-group-modal.component.spec.ts`)
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { CreateGroupModalComponent } from './create-group-modal.component';
import { ChatService } from '../../../../core/services/chat.service';
import { SocketService } from '../../../../core/services/socket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

describe('CreateGroupModalComponent', () => {
  let component: CreateGroupModalComponent;
  let fixture: ComponentFixture<CreateGroupModalComponent>;
  let chatServiceSpy: jasmine.SpyObj<ChatService>;
  let socketServiceSpy: jasmine.SpyObj<SocketService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com'
  } as User;

  beforeEach(async () => {
    const chatSpy = jasmine.createSpyObj('ChatService', [
      'searchUsers', 'getOnlineUsers', 'createRoomWithValidation'
    ]);
    const socketSpy = jasmine.createSpyObj('SocketService', ['connect'], {
      error$: new Subject()
    });
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    await TestBed.configureTestingModule({
      imports: [CreateGroupModalComponent, FormsModule],
      providers: [
        { provide: ChatService, useValue: chatSpy },
        { provide: SocketService, useValue: socketSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    chatServiceSpy = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
    socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    authServiceSpy.getCurrentUser.and.returnValue(mockUser);
    chatServiceSpy.getOnlineUsers.and.returnValue(of([]));

    fixture = TestBed.createComponent(CreateGroupModalComponent);
    component = fixture.componentInstance;
    component.currentUser = mockUser;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load online users on init', () => {
    const mockOnlineUsers: User[] = [
      { id: 2, name: 'Online User', is_online: true } as User
    ];
    chatServiceSpy.getOnlineUsers.and.returnValue(of(mockOnlineUsers));

    component.ngOnInit();

    expect(chatServiceSpy.getOnlineUsers).toHaveBeenCalled();
    expect(component.onlineUsers).toEqual(mockOnlineUsers);
  });

  it('should search users when search term changes', (done) => {
    const mockSearchResults: User[] = [
      { id: 3, name: 'Search Result', email: 'search@example.com' } as User
    ];
    chatServiceSpy.searchUsers.and.returnValue(of(mockSearchResults));

    component.ngOnInit();
    component.userSearchTerm = 'search';
    component.onSearchTermChange();

    setTimeout(() => {
      expect(chatServiceSpy.searchUsers).toHaveBeenCalledWith('search');
      expect(component.searchResults).toEqual(mockSearchResults);
      done();
    }, 350); // Wait for debounce
  });

  it('should create group successfully', (done) => {
    const mockCreationResult = {
      room: { id: 1, name: 'Test Group' } as any,
      validMembers: [],
      invalidMembers: []
    };
    chatServiceSpy.createRoomWithValidation.and.returnValue(of(mockCreationResult));

    component.groupName = 'Test Group';
    component.createGroup();

    setTimeout(() => {
      expect(chatServiceSpy.createRoomWithValidation).toHaveBeenCalled();
      expect(component.successMessage).toBeTruthy();
      done();
    }, 100);
  });

  it('should validate form before submission', () => {
    component.groupName = '';
    expect(component.isCreateDisabled()).toBe(true);

    component.groupName = 'Valid Name';
    expect(component.isCreateDisabled()).toBe(false);

    component.isCreating = true;
    expect(component.isCreateDisabled()).toBe(true);
  });

  it('should toggle user selection', () => {
    const user: User = { id: 2, name: 'Test User 2' } as User;

    expect(component.isUserSelected(user)).toBe(false);

    component.toggleUser(user);
    expect(component.selectedUsers).toContain(user);
    expect(component.isUserSelected(user)).toBe(true);

    component.toggleUser(user);
    expect(component.selectedUsers).not.toContain(user);
    expect(component.isUserSelected(user)).toBe(false);
  });

  it('should remove user from selection', () => {
    const user: User = { id: 2, name: 'Test User 2' } as User;
    component.selectedUsers = [user];

    component.removeUser(user);
    expect(component.selectedUsers).not.toContain(user);
  });

  it('should clear search', () => {
    component.userSearchTerm = 'test';
    component.searchResults = [{ id: 1 } as User];
    component.showSearchResults = true;

    component.clearSearch();

    expect(component.userSearchTerm).toBe('');
    expect(component.searchResults).toEqual([]);
    expect(component.showSearchResults).toBe(false);
    expect(component.showOnlineUsers).toBe(true);
  });
});
```

## 🏃‍♂️ Running Tests

### Backend Tests
```bash
cd api
npm test

# With coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Frontend Tests
```bash
cd cli
ng test

# Single run
ng test --watch=false

# With coverage
ng test --code-coverage
```

## 📊 Test Coverage Goals

### Minimum Coverage Targets
- **Backend**: 80% line coverage
- **Frontend**: 75% line coverage
- **Critical paths**: 95% coverage (authentication, room creation, user search)

### Key Areas to Test
1. **Authentication & Authorization**
2. **User Search Functionality**
3. **Room Creation Process**
4. **Socket.IO Event Handling**
5. **Error Handling**
6. **Form Validation**
7. **Real-time Updates**

## 🔄 Continuous Integration

### GitHub Actions Example (`.github/workflows/test.yml`)
```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test_db
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd api
          npm install
          
      - name: Run tests
        run: |
          cd api
          npm test
        env:
          NODE_ENV: test
          DB_HOST: 127.0.0.1
          DB_USER: root
          DB_PASS: root
          DB_NAME: test_db
          JWT_SECRET: test-secret

  frontend:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd cli
          npm install
          
      - name: Run tests
        run: |
          cd cli
          ng test --watch=false --browsers=ChromeHeadless
```

## 📝 Test Documentation

### Writing Good Tests
1. **Descriptive Test Names**: Use clear, descriptive names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
3. **Mock External Dependencies**: Use spies and mocks for services and HTTP calls
4. **Test Both Success and Error Cases**: Cover happy paths and error scenarios
5. **Keep Tests Independent**: Each test should be able to run in isolation

### Test Categories
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows (optional, for later implementation)

This testing setup provides a solid foundation for ensuring the reliability and maintainability of your chat room creation feature.
