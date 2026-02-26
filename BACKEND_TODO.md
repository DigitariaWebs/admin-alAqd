# Backend API Implementation TODO

## 1. Authentication & Authorization
- [x] Admin login
- [x] Admin logout
- [x] Password recovery
- [x] Reset password with token
- [x] Get current admin user
- [x] User phone login (OTP)
- [x] Verify OTP
- [x] Google OAuth login
- [x] Apple OAuth login
- [x] Refresh JWT token
- [x] User logout

## 2. User Profile Management
- [x] Get user profile by ID
- [x] Update user profile
- [x] Upload profile photos (multiple)
- [x] Delete profile photo
- [x] Set primary photo
- [x] Complete onboarding steps (name, DOB, gender, nationality, ethnicity, height, marital status, education, profession, location, bio, interests, faith, religious practice, personality, photos)
- [x] Get profile completion percentage
- [x] Delete user account

## 3. User Discovery & Matching
- [x] Get potential matches (swipe queue) based on preferences
- [x] Swipe actions (like, pass, superlike)
- [x] Send emoji reaction
- [x] Get match history
- [x] Get mutual matches
- [x] Refresh/reload swipe queue
- [x] Check if two users matched

## 4. Likes & Favorites
- [x] Get users who liked current user
- [x] Get users current user liked
- [x] Get filtered likes (new, mutual, premium)
- [x] Favorite/unfavorite user
- [x] Get favorite users list

## 5. Chat & Messaging
- [x] Get chat conversations list
- [x] Get chat messages for conversation
- [x] Send text message
- [x] Send emoji message
- [x] Mark messages as read
- [x] Delete conversation
- [x] Get unread message count
- [x] Real-time message notifications (short-poll every 3 s; upgrade to SSE/WebSocket when needed)

## 6. User Preferences & Filters
- [x] Get user preferences
- [x] Update discovery preferences (distance, age range)
- [x] Update advanced filters (religious practice, ethnicity, education, children, prayer, diet)
- [x] Reset preferences to default

## 7. Subscription & Premium
- [x] Get subscription plans
- [x] Purchase subscription
- [x] Cancel subscription
- [x] Get user subscription status
- [x] Check premium features access
- [x] Process payment (Stripe integration)

## 8. Profile Actions
- [x] Block user
- [x] Unblock user
- [x] Get blocked users list
- [x] Report user
- [x] Share profile
- [x] View profile analytics

## 9. Guardians/Mahram Management (Mobile & Admin)
- [ ] Create guardian relationship (female user invites guardian)
- [ ] Generate access code for guardian
- [ ] Accept guardian invitation
- [ ] Get guardian relationship details
- [ ] Revoke guardian access
- [ ] Resend guardian invitation
- [ ] List all guardian relationships (Admin)
- [ ] Update relationship status (Admin)
- [ ] Export guardian relationships (Admin)

## 10. Admin - Dashboard/Analytics
- [x] Total users, revenue, active subscriptions, growth stats
- [x] Weekly/monthly revenue data
- [x] Latest system activities
- [x] User growth over time
- [x] User engagement metrics
- [x] Generate custom reports
- [x] AI-generated insights

## 11. Admin - Users Management
- [ ] List users with filters (role, status, gender, nationality, age, date range)
- [ ] Create new user
- [ ] Get user details
- [ ] Update user
- [ ] Delete user
- [ ] Update user status (active/inactive/suspended)
- [ ] Export users to CSV/Excel
- [ ] List available roles
- [ ] Update user role

## 12. Admin - Content Management
- [ ] List all content (articles, videos, posts, pages)
- [ ] Create new content
- [ ] Get content details
- [ ] Update content
- [ ] Delete content
- [ ] Update content status (published/draft/pending)
- [ ] List content categories
- [ ] Create category
- [ ] Update category
- [ ] Delete category
- [ ] Get onboarding content
- [ ] Update onboarding content

## 13. Admin - Orders & Transactions
- [ ] List all orders with filters
- [ ] Get order details
- [ ] Update order status
- [ ] Transaction history
- [ ] Export orders report

## 14. Admin - Notifications
- [ ] List notification history
- [ ] Send push notification
- [ ] Schedule notification
- [ ] Delete scheduled notification
- [ ] Notification delivery stats

## 15. Admin - Settings
- [ ] Get all system settings
- [ ] Update general settings
- [ ] Update security settings
- [ ] List integrations status
- [ ] Update integration config
- [ ] Toggle maintenance mode

## 16. Admin - Support & Logs
- [ ] List support tickets
- [ ] Get ticket details
- [ ] Reply to ticket
- [ ] Update ticket status
- [ ] Support statistics
- [ ] System logs with filters
- [ ] Export system logs

## 17. File Upload & Media
- [ ] Upload image
- [ ] Upload video
- [ ] Upload document
- [ ] Delete uploaded file
- [ ] Get media URL
- [ ] Compress/optimize images

## 18. Configuration Data
- [ ] List countries with flags
- [ ] List ethnicities
- [ ] List education levels
- [ ] List religious practice options
- [ ] List faith tags
- [ ] List marital statuses
- [ ] List personality types
- [ ] List interests/hobbies

## 19. Notifications & Push
- [ ] Send push notification to user
- [ ] Send notification for new match
- [ ] Send notification for new message
- [ ] Send notification for new like
- [ ] Update notification preferences
- [ ] Get notification history

## 20. Search & Discovery
- [ ] Advanced user search
- [ ] Search by filters
- [ ] Get similar users
- [ ] Get recommendations
- [ ] Search optimization
