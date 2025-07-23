import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let lastCheckedTime = new Date(); // প্রথমবারের জন্য এখনকার সময়

export const startNotificationCron = () => {
  cron.schedule('* * * * *', async () => {
    console.log('🔔 Cron running: checking for new parcels...');

    const newParcels = await prisma.addParcel.findMany({
      where: {
        createdAt: {
          gte: lastCheckedTime,
        },
      },
    });

    if (newParcels.length) {
      for (const parcel of newParcels) {
        await prisma.notification.create({
          data: {
            title: `New parcel from marchent`,
            parcelId: parcel.id,
          },
        });
        console.log(`✅ Notification created for parcel ${parcel.id}`);
      }
    } else {
      console.log('ℹ️ No new parcels found.');
    }

    lastCheckedTime = new Date(); 
  });
};
