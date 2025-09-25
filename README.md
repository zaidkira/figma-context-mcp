# ☕ Coffee Shop Ordering System

A modern, full-stack web application for coffee shop management with online ordering, dashboard administration, and activation system.

## 🚀 Features

### Customer Interface
- **Modern UI/UX**: Beautiful, responsive design with mobile-first approach
- **Online Ordering**: Browse menu, add items to cart, and place orders
- **Real-time Cart**: Live cart updates with quantity controls
- **Category Filtering**: Filter menu items by category (Hot coffee, Cold coffee, Snacks, Desserts)
- **Activation System**: Secure app activation with monthly key expiry
- **Mobile Responsive**: Optimized for all device sizes

### Admin Dashboard
- **Live Order Management**: Real-time order tracking and status updates
- **Menu Management**: Add, edit, and delete menu items with categories
- **Export Functionality**: CSV export for completed orders (Daily, Weekly, Monthly, All-time)
- **Authentication**: Secure login system for dashboard access
- **Order Analytics**: Track order completion and revenue

### Technical Features
- **Progressive Web App**: Service worker for offline functionality
- **Database Integration**: MongoDB with Mongoose ODM
- **RESTful API**: Express.js backend with comprehensive endpoints
- **Security**: Activation key system with monthly expiry
- **Responsive Design**: Mobile-first CSS with modern styling

## 🛠️ Tech Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript**: No framework dependencies
- **Progressive Web App**: Service worker for offline support

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **CORS**: Cross-origin resource sharing

## 📁 Project Structure

```
figma-context-mcp/
├── index.html              # Main customer interface
├── dashboard.html           # Admin dashboard
├── login.html              # Admin login page
├── app.js                  # Customer-side JavaScript
├── dashboard.js            # Admin dashboard JavaScript
├── server.js               # Express.js backend
├── styles.css              # Main stylesheet
├── dashboard.css           # Dashboard-specific styles
├── sw.js                   # Service worker
├── manifest.json           # PWA manifest
├── package.json            # Dependencies and scripts
└── assets/
    └── images/             # Image assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zaidkira/figma-context-mcp.git
   cd figma-context-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGO_URL=mongodb://localhost:27017/coffee-shop
   PORT=3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Customer Interface: `http://localhost:3000`
   - Admin Dashboard: `http://localhost:3000/dashboard.html`
   - Admin Login: `http://localhost:3000/login.html`

## 🔑 Activation System

The application includes a secure activation system:

- **Default Activation Key**: `COFFEE2024`
- **Monthly Expiry**: Keys expire after 30 days
- **Floating Button**: Easy re-activation access
- **Secure Storage**: Activation data stored in localStorage

### Changing the Activation Key
Edit the `ACTIVATION_KEY` constant in `app.js`:
```javascript
const ACTIVATION_KEY = 'YOUR_NEW_KEY';
```

## 👥 Admin Access

### Default Credentials
- **Username**: `admin`
- **Password**: `zaid`

### Changing Admin Credentials
Edit the `VALID_CREDENTIALS` object in `login.html`:
```javascript
const VALID_CREDENTIALS = {
  username: 'your_username',
  password: 'your_password'
};
```

## 📊 Dashboard Features

### Order Management
- View pending orders in real-time
- Mark orders as completed or canceled
- Group orders by table and time
- Auto-refresh every 5 seconds

### Menu Management
- Add new menu items with categories
- Set prices and descriptions
- Upload images (base64 encoded)
- Delete existing items

### Export Functionality
- Export completed orders to CSV
- Filter by time period (Daily, Weekly, Monthly, All-time)
- Include revenue calculations
- Download with formatted data

## 🎨 Customization

### Styling
- Modify `styles.css` for main styling
- Edit `dashboard.css` for dashboard-specific styles
- Update CSS variables in `:root` for theme colors

### Menu Categories
Edit the `FIXED_CATEGORIES` array in `dashboard.js`:
```javascript
const FIXED_CATEGORIES = ['Hot coffee', 'snacks', 'cold coffee', 'dessert'];
```

### API Configuration
The app automatically detects the API base URL. You can:
- Set `window.API_BASE` in your HTML
- Use URL parameter: `?api_base=https://your-api.com`
- Set in localStorage: `localStorage.setItem('api_base', 'https://your-api.com')`

## 🔧 API Endpoints

### Orders
- `GET /api/orders` - Get pending orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id` - Update order status
- `GET /api/orders/completed-canceled` - Get completed/canceled orders

### Menu
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Add new menu item
- `DELETE /api/menu/:id` - Delete menu item

## 📱 Progressive Web App

The application is a PWA with:
- Service worker for offline functionality
- App manifest for installation
- Responsive design for all devices
- Caching strategy for performance

## 🚀 Deployment

### Heroku
1. Create a Heroku app
2. Set environment variables:
   ```bash
   heroku config:set MONGO_URL=your_mongodb_connection_string
   ```
3. Deploy:
   ```bash
   git push heroku main
   ```

### Netlify
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set publish directory: `/`
4. Add environment variables in Netlify dashboard

### Vercel
1. Import your GitHub repository
2. Set build command: `npm install`
3. Add environment variables
4. Deploy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Zaid Kira**
- GitHub: [@zaidkira](https://github.com/zaidkira)

## 🙏 Acknowledgments

- Fonts: [Google Fonts](https://fonts.google.com/)
- Icons: Custom SVG icons
- Design: Modern coffee shop aesthetic
- Inspiration: Real-world coffee shop needs

## 📞 Support

For support, email support@coffeeshop.com or create an issue in the GitHub repository.

---

**Made with ☕ and ❤️ for coffee lovers everywhere**