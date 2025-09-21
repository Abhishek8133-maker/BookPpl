-- Insert common skills categories and skills
INSERT INTO public.skills (name, category, description) VALUES
-- Home & Garden
('Plumbing', 'Home & Garden', 'Fixing pipes, faucets, and water systems'),
('Electrical Work', 'Home & Garden', 'Electrical repairs and installations'),
('Gardening', 'Home & Garden', 'Lawn care, planting, and garden maintenance'),
('Painting', 'Home & Garden', 'Interior and exterior painting services'),
('Carpentry', 'Home & Garden', 'Wood working and furniture repair'),
('Cleaning', 'Home & Garden', 'House cleaning and organization'),

-- Technology
('Computer Repair', 'Technology', 'Hardware and software troubleshooting'),
('Web Development', 'Technology', 'Building websites and web applications'),
('Phone Setup', 'Technology', 'Setting up smartphones and apps'),
('Data Recovery', 'Technology', 'Recovering lost files and data'),

-- Transportation
('Moving Help', 'Transportation', 'Helping with relocations and heavy lifting'),
('Car Repair', 'Transportation', 'Automotive maintenance and repairs'),
('Delivery', 'Transportation', 'Package and item delivery services'),

-- Personal Services
('Pet Sitting', 'Personal Services', 'Taking care of pets while owners are away'),
('Tutoring', 'Personal Services', 'Educational support and teaching'),
('Cooking', 'Personal Services', 'Meal preparation and cooking lessons'),
('Photography', 'Personal Services', 'Event and portrait photography'),
('Music Lessons', 'Personal Services', 'Teaching musical instruments'),

-- Business Services
('Accounting', 'Business Services', 'Bookkeeping and tax preparation'),
('Writing', 'Business Services', 'Content creation and editing'),
('Translation', 'Business Services', 'Language translation services'),
('Marketing', 'Business Services', 'Digital marketing and promotion')

ON CONFLICT (name) DO NOTHING;
