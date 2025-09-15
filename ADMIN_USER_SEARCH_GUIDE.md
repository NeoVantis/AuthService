# Admin User Search & Sorting Guide

## 🔍 **How to Search and Sort Users**

Now you can easily find users and sort them! Here are all the ways to use the enhanced user management:

## **Available Search & Sort Parameters**

### **Basic Pagination**
```
GET /api/v1/admin/users?page=1&limit=20
```

### **Search Functionality**
```bash
# Search in all fields (username, email, fullName, college)
GET /api/v1/admin/users?search=john

# Search only in specific field
GET /api/v1/admin/users?search=john&searchField=username
GET /api/v1/admin/users?search=example.com&searchField=email
GET /api/v1/admin/users?search=university&searchField=college
GET /api/v1/admin/users?search=smith&searchField=fullName
```

**Search Fields:**
- `username` - Search in usernames only
- `email` - Search in email addresses only  
- `fullName` - Search in full names only
- `college` - Search in college/institution names only
- `all` (default) - Search across all fields

### **Sorting Options**
```bash
# Sort by creation date (newest first) - DEFAULT
GET /api/v1/admin/users?sortBy=createdAt&sortOrder=DESC

# Sort by username alphabetically
GET /api/v1/admin/users?sortBy=username&sortOrder=ASC

# Sort by email
GET /api/v1/admin/users?sortBy=email&sortOrder=ASC

# Sort by verification status (verified users first)
GET /api/v1/admin/users?sortBy=isVerified&sortOrder=DESC

# Sort by active status (active users first)
GET /api/v1/admin/users?sortBy=isActive&sortOrder=DESC
```

**Sort Fields:**
- `createdAt` - Sort by registration date
- `username` - Sort alphabetically by username
- `email` - Sort alphabetically by email
- `fullName` - Sort alphabetically by full name
- `isVerified` - Sort by verification status
- `isActive` - Sort by account status

**Sort Orders:**
- `ASC` - Ascending (A-Z, oldest first, false first)
- `DESC` - Descending (Z-A, newest first, true first)

### **Filtering (Original Features)**
```bash
# Show only verified users
GET /api/v1/admin/users?verified=true

# Show only active users  
GET /api/v1/admin/users?active=true

# Show inactive/deactivated users
GET /api/v1/admin/users?active=false
```

## **🚀 Real-World Examples**

### **Find a Specific User**
```bash
# Find user by username
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/api/v1/admin/users?search=john_doe&searchField=username"

# Find user by email
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/api/v1/admin/users?search=john@example.com&searchField=email"
```

### **Browse Users by Institution**
```bash
# Find all users from a specific university
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/api/v1/admin/users?search=harvard&searchField=college&sortBy=fullName&sortOrder=ASC"
```

### **Get Recently Registered Users**
```bash
# Get newest users first (default sorting)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/api/v1/admin/users?sortBy=createdAt&sortOrder=DESC&limit=50"
```

### **Find Problematic Accounts**
```bash
# Find unverified users
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/api/v1/admin/users?verified=false&sortBy=createdAt&sortOrder=DESC"

# Find inactive/deactivated accounts
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/api/v1/admin/users?active=false&sortBy=createdAt&sortOrder=DESC"
```

### **Combined Search & Filter**
```bash
# Search for "john" in active, verified users, sorted by name
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/api/v1/admin/users?search=john&active=true&verified=true&sortBy=fullName&sortOrder=ASC"
```

## **📱 Frontend Implementation Examples**

### **Search Input Component**
```javascript
// Search users as you type
const searchUsers = async (searchTerm, searchField = 'all') => {
  const params = new URLSearchParams({
    search: searchTerm,
    searchField: searchField,
    page: '1',
    limit: '20'
  });

  const response = await fetch(`/api/v1/admin/users?${params}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  return response.json();
};

// Usage
searchUsers('john', 'username');
searchUsers('university', 'college');
searchUsers('example.com', 'email');
```

### **Sortable Table Headers**
```javascript
// Sort table by clicking column headers
const sortUsers = async (sortBy, sortOrder) => {
  const params = new URLSearchParams({
    sortBy: sortBy,
    sortOrder: sortOrder,
    page: currentPage,
    limit: itemsPerPage
  });

  const response = await fetch(`/api/v1/admin/users?${params}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  return response.json();
};

// Usage
sortUsers('username', 'ASC');  // Sort by username A-Z
sortUsers('createdAt', 'DESC'); // Sort by newest first
sortUsers('isVerified', 'DESC'); // Show verified users first
```

### **Advanced Filter Component**
```javascript
// Complete search with all filters
const searchUsersAdvanced = async (filters) => {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.searchField) params.append('searchField', filters.searchField);
  if (filters.verified !== null) params.append('verified', filters.verified);
  if (filters.active !== null) params.append('active', filters.active);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  
  params.append('page', filters.page || '1');
  params.append('limit', filters.limit || '20');

  const response = await fetch(`/api/v1/admin/users?${params}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  return response.json();
};

// Usage
searchUsersAdvanced({
  search: 'john',
  searchField: 'username',
  verified: true,
  active: true,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
  page: 1,
  limit: 50
});
```

## **⚡ Performance Tips**

1. **Use specific search fields** when possible instead of 'all' for better performance
2. **Limit results** with reasonable page sizes (10-50 users per page)
3. **Cache search results** in your frontend to avoid repeated API calls
4. **Debounce search input** to avoid making API calls on every keystroke

## **🔐 Security Notes**

- All endpoints require valid admin authentication
- Search terms are automatically sanitized to prevent injection
- UUID validation is enforced for user IDs
- Rate limiting should be implemented for production use

Now you can easily find any user in your system! 🎉
