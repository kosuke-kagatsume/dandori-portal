import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://dandori_admin:DandoriAdmin2025Secure@dandori-portal-db.chya4uuiiy9m.ap-northeast-1.rds.amazonaws.com:5432/dandori_portal?schema=public'
      }
    }
  });

  const password = 'DandoriAdmin2025!';
  const passwordHash = await bcrypt.hash(password, 10);
  
  console.log('New password hash:', passwordHash);
  
  const user = await prisma.user.update({
    where: { email: 'admin@dandori-work.com' },
    data: { passwordHash },
  });
  
  console.log('Updated user:', user.email);
  console.log('User ID:', user.id);
  
  await prisma.$disconnect();
}

main().catch(console.error);
