import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Models
import { User } from '../lib/db/models/User';
import { Order } from '../lib/db/models/Order';
import { Transaction } from '../lib/db/models/Transaction';
import { Content } from '../lib/db/models/Content';
import { Category } from '../lib/db/models/Category';

// Helper functions
function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}${random}`;
}

function generateTransactionNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TRX-${timestamp}${random}`;
}

const PLANS = [
    { name: 'Premium Monthly', durationMonths: 1, price: 12.99 },
    { name: 'Premium Quarterly', durationMonths: 3, price: 34.99 },
    { name: 'Premium Yearly', durationMonths: 12, price: 119.99 },
    { name: 'Gold Monthly', durationMonths: 1, price: 19.99 },
    { name: 'Gold Quarterly', durationMonths: 3, price: 49.99 },
    { name: 'Gold Yearly', durationMonths: 12, price: 179.99 },
];

const CUSTOMERS = [
    { name: 'Sarah Wilson', email: 'sarah.wilson@email.com' },
    { name: 'Ahmed Hassan', email: 'ahmed.hassan@email.com' },
    { name: 'John Doe', email: 'john.doe@email.com' },
    { name: 'Maria Garcia', email: 'maria.garcia@email.com' },
    { name: 'Omar Khalid', email: 'omar.khalid@email.com' },
    { name: 'Fatima Ahmed', email: 'fatima.ahmed@email.com' },
    { name: 'David Chen', email: 'david.chen@email.com' },
    { name: 'Aisha Mohamed', email: 'aisha.mohamed@email.com' },
    { name: 'Michael Brown', email: 'michael.brown@email.com' },
    { name: 'Layla Rahman', email: 'layla.rahman@email.com' },
];

const ORDER_STATUSES = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

async function seedOrders(userIds: mongoose.Types.ObjectId[]) {
    console.log('Seeding orders...');

    const orders = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
        const userIndex = Math.floor(Math.random() * userIds.length);
        const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
        const plan = PLANS[Math.floor(Math.random() * PLANS.length)];
        const status = ORDER_STATUSES[Math.floor(Math.random() * ORDER_STATUSES.length)];
        const paymentStatus = status === 'completed' ? 'paid' : status === 'failed' ? 'failed' : status === 'refunded' ? 'refunded' : 'pending';

        // Random date within last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const order = {
            orderNumber: generateOrderNumber(),
            userId: userIds[userIndex],
            customerName: customer.name,
            customerEmail: customer.email,
            items: [{
                name: plan.name,
                description: `${plan.durationMonths} month subscription`,
                price: plan.price,
                quantity: 1,
                total: plan.price,
            }],
            subtotal: plan.price,
            tax: 0,
            total: plan.price,
            status,
            paymentStatus,
            payment: {
                method: 'card',
                provider: 'stripe',
                last4: String(Math.floor(1000 + Math.random() * 9000)),
            },
            planId: plan.name.toLowerCase().includes('gold') ? 'gold' : 'premium',
            createdAt: orderDate,
            updatedAt: orderDate,
            ...(status === 'completed' && { completedAt: orderDate }),
            ...(status === 'failed' && { failedAt: orderDate }),
            ...(status === 'refunded' && { refundedAt: orderDate }),
        };

        orders.push(order);
    }

    await Order.insertMany(orders);
    console.log(`✅ Created ${orders.length} orders`);
}

async function seedTransactions(userIds: mongoose.Types.ObjectId[]) {
    console.log('Seeding transactions...');

    const transactions = [];
    const now = new Date();

    // First, get some orders to link to transactions
    const orders = await Order.find().limit(50).lean();

    for (let i = 0; i < 80; i++) {
        const userIndex = Math.floor(Math.random() * userIds.length);
        const type = Math.random() > 0.3 ? 'debit' : 'credit';
        const amount = type === 'debit'
            ? Math.random() * 200 + 10
            : Math.random() * 100 + 20;

        const isOrder = type === 'debit' && orders.length > 0;
        const order = isOrder ? orders[Math.floor(Math.random() * orders.length)] : null;

        const daysAgo = Math.floor(Math.random() * 90);
        const txDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const descriptions = type === 'debit'
            ? ['Subscription Payment', 'Profile Boost', 'Premium Features', 'Gift Purchase']
            : ['Wallet Top-up', 'Referral Bonus', 'Refund', 'Promotion Credit'];

        const transaction = {
            transactionNumber: generateTransactionNumber(),
            orderId: order?._id,
            userId: userIds[userIndex],
            type,
            amount: Math.round(amount * 100) / 100,
            currency: 'USD',
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            status: Math.random() > 0.1 ? 'completed' : 'pending',
            paymentMethod: 'card',
            provider: 'stripe',
            last4: String(Math.floor(1000 + Math.random() * 9000)),
            createdAt: txDate,
            ...(Math.random() > 0.1 && { completedAt: txDate }),
        };

        transactions.push(transaction);
    }

    await Transaction.insertMany(transactions);
    console.log(`✅ Created ${transactions.length} transactions`);
}

async function seedContent() {
    console.log('Seeding content...');

    // Get categories
    const categories = await Category.find().lean();

    if (categories.length === 0) {
        console.log('⚠️ No categories found, creating default categories...');

        const defaultCategories = [
            { name: 'Dating Tips', slug: 'dating-tips', description: 'Tips for successful dating' },
            { name: 'Relationship Advice', slug: 'relationship-advice', description: 'Advice for relationships' },
            { name: 'Marriage Guidance', slug: 'marriage-guidance', description: 'Guidance for marriage' },
            { name: 'Islamic Dating', slug: 'islamic-dating', description: 'Islamic perspective on dating' },
            { name: 'Success Stories', slug: 'success-stories', description: 'Real success stories from users' },
        ];

        await Category.insertMany(defaultCategories.map(cat => ({
            ...cat,
            isActive: true,
            order: defaultCategories.indexOf(cat),
        })));

        console.log(`✅ Created ${defaultCategories.length} categories`);
    }

    const updatedCategories = await Category.find().lean();

    // Clear existing content
    await Content.deleteMany({});

    const contents = [];

    const contentData = [
        {
            title: '5 Tips for a Successful First Date',
            content: 'First dates can be nerve-wracking, but with the right preparation, you can make a great impression. Here are five essential tips...',
            type: 'article' as const,
            category: 'Dating Tips',
        },
        {
            title: 'Understanding Marriage in Islam',
            content: 'Marriage is a significant milestone in every Muslim\'s life. This guide explores the Islamic perspective on marriage...',
            type: 'article' as const,
            category: 'Marriage Guidance',
        },
        {
            title: 'How to Communicate Effectively',
            content: 'Communication is the foundation of any healthy relationship. Learn how to express your feelings and listen actively...',
            type: 'article' as const,
            category: 'Relationship Advice',
        },
        {
            title: 'Red Flags to Watch For',
            content: 'Being aware of potential red flags can save you from heartache. Here are the warning signs to look out for...',
            type: 'article' as const,
            category: 'Dating Tips',
        },
        {
            title: 'Building Trust in Relationships',
            content: 'Trust takes time to build but can be broken in an instant. Learn how to establish and maintain trust...',
            type: 'article' as const,
            category: 'Relationship Advice',
        },
        {
            title: 'Questions to Ask Before Marriage',
            content: 'Before taking the plunge, have important conversations. Here are crucial questions every couple should discuss...',
            type: 'article' as const,
            category: 'Marriage Guidance',
        },
        {
            title: 'Balancing Career and Relationship',
            content: 'Modern life can be busy, but your relationship deserves attention. Tips for maintaining work-life balance...',
            type: 'article' as const,
            category: 'Relationship Advice',
        },
        {
            title: 'Dealing with Family Expectations',
            content: 'Family can play a big role in Muslim marriages. Here\'s how to navigate family expectations respectfully...',
            type: 'article' as const,
            category: 'Islamic Dating',
        },
    ];

    for (let i = 0; i < contentData.length; i++) {
        const data = contentData[i];

        contents.push({
            title: data.title,
            slug: data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            content: data.content,
            type: data.type,
            category: data.category,
            status: Math.random() > 0.2 ? 'published' : 'draft',
            author: 'Admin',
            tags: ['dating', 'relationship', 'tips'].slice(0, Math.floor(Math.random() * 3) + 1),
            viewCount: Math.floor(Math.random() * 1000),
            publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        });
    }

    // Add page content
    const pageData = [
        {
            title: 'Welcome to Al-Aqd',
            content: 'Welcome to Al-Aqd, the premier Muslim dating platform. Here\'s what you need to know to get started...',
            type: 'page' as const,
            category: 'General',
        },
        {
            title: 'About Us',
            content: 'Al-Aqd is dedicated to helping Muslim singles find meaningful relationships within the boundaries of Islamic principles...',
            type: 'page' as const,
            category: 'General',
        },
    ];

    for (const data of pageData) {
        contents.push({
            title: data.title,
            slug: data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            content: data.content,
            type: data.type,
            category: data.category,
            status: 'published',
            author: 'Admin',
            tags: [],
            viewCount: Math.floor(Math.random() * 500),
            publishedAt: new Date(),
        });
    }

    await Content.insertMany(contents);
    console.log(`✅ Created ${contents.length} content items`);
}

async function main() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/al-aqd';

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    try {
        // Get existing users or create a few test users
        let users = await User.find({ role: 'user' }).limit(10).lean();

        if (users.length === 0) {
            console.log('No users found, creating test users...');

            // Hash password
            const hashedPassword = await bcrypt.hash('password123', 12);

            const testUsers = CUSTOMERS.map((customer, i) => ({
                name: customer.name,
                email: customer.email,
                phoneNumber: `+1234567${String(i).padStart(4, '0')}`,
                password: hashedPassword,
                gender: i % 2 === 0 ? 'male' : 'female',
                role: 'user',
                status: 'active',
                isOnboarded: true,
                provider: 'email',
                subscription: {
                    plan: Math.random() > 0.5 ? 'premium' : 'free',
                    isActive: Math.random() > 0.5,
                },
            }));

            const createdUsers = await User.insertMany(testUsers);
            users = createdUsers;
            console.log(`✅ Created ${users.length} test users`);
        }

        const userIds = users.map(u => u._id as mongoose.Types.ObjectId);

        // Clear existing data (optional - comment out if you want to keep existing data)
        console.log('Clearing existing orders and transactions...');
        await Order.deleteMany({});
        await Transaction.deleteMany({});

        // Seed data
        await seedOrders(userIds);
        await seedTransactions(userIds);
        await seedContent();

        console.log('\n🎉 Seeding completed successfully!');

    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

main();
