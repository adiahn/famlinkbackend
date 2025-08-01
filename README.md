# FamTree Backend API

A comprehensive Express.js backend API for the FamTree family tree management application, built with MongoDB and following RESTful API best practices.

## 🚀 Features

- **User Authentication**: JWT-based authentication with phone verification
- **Family Management**: Create, manage, and link family trees
- **Join ID System**: Unique codes for family linking
- **File Upload**: Profile picture and avatar management
- **Real-time Updates**: WebSocket support for live updates
- **Security**: Rate limiting, CORS, helmet, input validation
- **Logging**: Comprehensive logging with Winston
- **Error Handling**: Centralized error handling with proper HTTP status codes

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi schema validation
- **File Upload**: Multer with Sharp for image processing
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting
- **Real-time**: Socket.io (planned)

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   └── authController.js    # Authentication logic
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   ├── errorHandler.js     # Error handling
│   │   ├── notFound.js         # 404 handler
│   │   └── validateRequest.js  # Request validation
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── Family.js           # Family model
│   │   └── FamilyMember.js     # Family member model
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── users.js            # User profile routes
│   │   ├── families.js         # Family management routes
│   │   └── search.js           # Search routes
│   ├── services/               # Business logic services
│   ├── utils/
│   │   ├── logger.js           # Winston logger
│   │   ├── generateToken.js    # JWT token generation
│   │   └── generateJoinId.js   # Join ID generation
│   ├── validators/
│   │   └── authValidators.js   # Joi validation schemas
│   └── server.js               # Main server file
├── logs/                       # Application logs
├── package.json
├── env.example                 # Environment variables template
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/famtree
   JWT_SECRET=your-super-secret-jwt-key
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### Sign In
```http
POST /api/auth/signin
Content-Type: application/json

{
  "phone": "+1234567890",
  "password": "password123"
}
```

#### Verify Phone
```http
POST /api/auth/verify-phone
Content-Type: application/json

{
  "phone": "+1234567890",
  "verificationCode": "123456"
}
```

### Family Management Endpoints

#### Create Family
```http
POST /api/families
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Smith Family",
  "creatorJoinId": "ABC123"
}
```

#### Get User's Family
```http
GET /api/families/my-family
Authorization: Bearer <token>
```

### User Profile Endpoints

#### Get Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/famtree` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit requests per window | `100` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |

### Database Models

#### User Model
- Basic user information (name, phone, email)
- Password hashing with bcrypt
- Phone verification system
- Privacy settings

#### Family Model
- Family information and settings
- Creator relationship
- Join ID system

#### FamilyMember Model
- Individual family member data
- Relationship tracking
- Avatar and bio information

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent abuse and DDoS attacks
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **Request Sanitization**: Prevent injection attacks

## 📝 Logging

The application uses Winston for comprehensive logging:

- **Console Logging**: Development environment
- **File Logging**: Production environment
- **Error Tracking**: Detailed error logs with stack traces
- **Request Logging**: HTTP request/response logging

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📦 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
```

## 🔄 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {
      "field": "field_name",
      "message": "Field-specific error"
    }
  }
}
```

## 🚧 TODO

- [ ] Implement family management controllers
- [ ] Add file upload functionality
- [ ] Implement search functionality
- [ ] Add WebSocket support
- [ ] Implement email/SMS services
- [ ] Add comprehensive testing
- [ ] Add API documentation with Swagger
- [ ] Implement caching with Redis
- [ ] Add database migrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team. 