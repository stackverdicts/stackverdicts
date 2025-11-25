import { query } from './src/config/database';
import { randomUUID } from 'crypto';

async function seedMarketingPopup() {
  console.log('Creating test marketing popup...');

  const id = randomUUID();

  // Sample popup with dummy content
  const popupData = {
    id,
    title: 'Get 50% Off Your First Year!',
    content: `Don't miss out on our exclusive limited-time offer for new subscribers.

Join thousands of developers who trust StackVerdicts for honest reviews and expert insights on the best development tools and hosting platforms.

Subscribe to our newsletter and get instant access to exclusive deals, early access to reviews, and weekly tips to supercharge your development workflow.`,
    image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
    button_text: 'Claim Your Discount',
    button_url: 'https://example.com/subscribe',
    display_frequency: 'every_page_view',
    is_active: true,
    delay_seconds: 1,
  };

  await query(
    `INSERT INTO marketing_popups (id, title, content, image_url, button_text, button_url, display_frequency, is_active, delay_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       content = VALUES(content),
       image_url = VALUES(image_url),
       button_text = VALUES(button_text),
       button_url = VALUES(button_url),
       display_frequency = VALUES(display_frequency),
       is_active = VALUES(is_active),
       delay_seconds = VALUES(delay_seconds)`,
    [
      popupData.id,
      popupData.title,
      popupData.content,
      popupData.image_url,
      popupData.button_text,
      popupData.button_url,
      popupData.display_frequency,
      popupData.is_active,
      popupData.delay_seconds,
    ]
  );

  console.log('✅ Marketing popup created successfully!');
  console.log('');
  console.log('Popup Details:');
  console.log(`  Title: ${popupData.title}`);
  console.log(`  Frequency: ${popupData.display_frequency}`);
  console.log(`  Active: ${popupData.is_active}`);
  console.log(`  Delay: ${popupData.delay_seconds} seconds`);
  console.log('');
  console.log('The popup will now appear on every page view on the public site.');
  console.log('Visit http://localhost:3000 to see it in action!');

  process.exit(0);
}

seedMarketingPopup().catch((err) => {
  console.error('Error seeding marketing popup:', err);
  process.exit(1);
});
