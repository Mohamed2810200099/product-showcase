# Auth Testing Playbook - The Girl House

## MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
```
Verify: bcrypt hash starts with `$2b$`, indexes exist on users.email (unique).

## API Testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@thegirlhouse.eg","password":"Admin@123"}'
cat cookies.txt
curl -b cookies.txt http://localhost:8001/api/auth/me
```
Login sets access_token + refresh_token cookies. /me returns user.
