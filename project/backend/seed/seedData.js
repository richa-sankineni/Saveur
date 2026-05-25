require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const seed = async () => {
  await db.init();
  console.log('\n🌱 Starting seed...\n');

  
  const users = [
    { name: 'Super Admin',   email: 'admin@restaurant.com',   password: 'admin123',   role: 'admin' },
    { name: 'Chef Ramsay',   email: 'chef@restaurant.com',    password: 'chef123',    role: 'chef' },
    { name: 'Waiter James',  email: 'waiter@restaurant.com',  password: 'waiter123',  role: 'waiter' },
    { name: 'Alice Customer',email: 'alice@email.com',         password: 'alice123',   role: 'customer' },
    { name: 'Bob Customer',  email: 'bob@email.com',           password: 'bob123',     role: 'customer' },
  ];

  for (const u of users) {
    const existing = db.get('SELECT id FROM users WHERE email = ?', [u.email]);
    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 12);
      db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [u.name, u.email, hashed, u.role]);
      console.log(`✅ User created: ${u.name} (${u.role}) — ${u.email} / ${u.password}`);
    } else {
      console.log(`⏭️  User exists: ${u.email}`);
    }
  }

  
  const tables = [
    { tableNumber: 1, capacity: 2 },
    { tableNumber: 2, capacity: 4 },
    { tableNumber: 3, capacity: 4 },
    { tableNumber: 4, capacity: 6 },
    { tableNumber: 5, capacity: 8 },
    { tableNumber: 6, capacity: 2 },
  ];

  for (const t of tables) {
    const existing = db.get('SELECT id FROM tables_info WHERE tableNumber = ?', [t.tableNumber]);
    if (!existing) {
      db.run('INSERT INTO tables_info (tableNumber, capacity, status) VALUES (?, ?, ?)',
        [t.tableNumber, t.capacity, 'available']);
      console.log(`✅ Table ${t.tableNumber} created (capacity: ${t.capacity})`);
    }
  }

 
  const menuItems = [
    
    { name: 'Veg Spring Rolls',     category: 'Starter',   price: 149, description: 'Crispy rolls with mixed vegetables', availability: 1 },
    { name: 'Chicken Wings',        category: 'Starter',   price: 299, description: 'Spicy buffalo wings with dip', availability: 1 },
    { name: 'Garlic Bread',         category: 'Starter',   price: 99,  description: 'Toasted garlic bread with herbs', availability: 1 },
    { name: 'Soup of the Day',      category: 'Starter',   price: 129, description: 'Chef\'s daily special soup', availability: 1 },


    { name: 'Paneer Butter Masala', category: 'Main Course', price: 349, description: 'Rich tomato-based paneer curry', availability: 1 },
    { name: 'Dal Makhani',          category: 'Main Course', price: 299, description: 'Slow-cooked black lentils', availability: 1 },
    { name: 'Chicken Biryani',      category: 'Main Course', price: 399, description: 'Fragrant basmati with spiced chicken', availability: 1 },
    { name: 'Grilled Salmon',       category: 'Main Course', price: 699, description: 'Herb-crusted salmon with veggies', availability: 1 },
    { name: 'Margherita Pizza',     category: 'Main Course', price: 349, description: 'Classic pizza with mozzarella', availability: 1 },
    { name: 'Pasta Arrabbiata',     category: 'Main Course', price: 299, description: 'Penne in spicy tomato sauce', availability: 1 },

   
    { name: 'Butter Naan',          category: 'Bread', price: 49,  description: 'Soft leavened bread with butter', availability: 1 },
    { name: 'Tandoori Roti',        category: 'Bread', price: 39,  description: 'Whole wheat bread from tandoor', availability: 1 },

   
    { name: 'Mango Lassi',          category: 'Drinks', price: 99,  description: 'Chilled mango yogurt drink', availability: 1 },
    { name: 'Fresh Lime Soda',      category: 'Drinks', price: 79,  description: 'Refreshing lime with soda', availability: 1 },
    { name: 'Masala Chai',          category: 'Drinks', price: 49,  description: 'Spiced Indian tea', availability: 1 },
    { name: 'Cold Coffee',          category: 'Drinks', price: 129, description: 'Blended coffee with ice cream', availability: 1 },

   
    { name: 'Gulab Jamun',          category: 'Dessert', price: 99,  description: 'Soft milk dumplings in sugar syrup', availability: 1 },
    { name: 'Chocolate Lava Cake',  category: 'Dessert', price: 249, description: 'Warm cake with molten chocolate center', availability: 1 },
    { name: 'Ice Cream (2 scoops)', category: 'Dessert', price: 149, description: 'Vanilla, chocolate, or strawberry', availability: 1 },
    { name: 'Unavailable Dish',     category: 'Starter', price: 999, description: 'This item is currently unavailable', availability: 0 },
  ];

  for (const item of menuItems) {
    const existing = db.get('SELECT id FROM menu_items WHERE name = ?', [item.name]);
    if (!existing) {
      db.run(
        'INSERT INTO menu_items (name, category, price, availability, description) VALUES (?, ?, ?, ?, ?)',
        [item.name, item.category, item.price, item.availability, item.description]
      );
      console.log(`✅ Menu item: ${item.name} (₹${item.price})`);
    }
  }

  console.log('\n🎉 Seed completed!\n');
  console.log('═══════════════════════════════════════');
  console.log('  Login Credentials:');
  console.log('═══════════════════════════════════════');
  users.forEach(u => {
    console.log(`  ${u.role.padEnd(9)} → ${u.email} / ${u.password}`);
  });
  console.log('═══════════════════════════════════════\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
