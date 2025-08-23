USE hotel_data;

CREATE TABLE `guests` (
  `guest_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL, 
  PRIMARY KEY (`guest_id`)
);

-- Table: rooms
CREATE TABLE `rooms` (
  `room_id` int(11) NOT NULL AUTO_INCREMENT,
  `room_type` varchar(50) NOT NULL, 
  `description` text DEFAULT NULL,
  `available` tinyint(1) DEFAULT 1,
  `price` decimal(10,2) DEFAULT NULL,
  `capacity` int DEFAULT 4, 
  PRIMARY KEY (`room_id`)
) ;

CREATE TABLE `staff` (
  `staff_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,      
  `salary` decimal(10,2) DEFAULT NULL,   
  `shift` varchar(50) DEFAULT NULL,      
  `hired_date` date DEFAULT NULL,        
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `phone` (`phone`)           
);

CREATE TABLE `services` (
  `service_id` int(11) NOT NULL AUTO_INCREMENT,
  `service_name` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`service_id`)
) ;

CREATE TABLE `inventory` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `item_name` varchar(100) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`item_id`)
) ;

CREATE TABLE `offers` (
  `offer_id` int(11) NOT NULL AUTO_INCREMENT,
  `description` text DEFAULT NULL,
  `discount_percentage` decimal(5,2) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`offer_id`)
);

CREATE TABLE `admin` (
  `admin_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`admin_id`)
);

CREATE TABLE `bookings` (
  `booking_id` int(11) NOT NULL AUTO_INCREMENT,
  `guest_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `booking_date` date DEFAULT NULL,
  `check_in` date DEFAULT NULL,
  `check_out` date DEFAULT NULL,
  `status` enum('Confirmed','Checked-in','Checked-out','Cancelled','No-show') NOT NULL DEFAULT 'Confirmed', -- Added later
  PRIMARY KEY (`booking_id`),
  KEY `bookings_fk_guest_idx` (`guest_id`), -- Index for FK
  KEY `bookings_fk_room_idx` (`room_id`),   -- Index for FK
  CONSTRAINT `bookings_fk_guest` FOREIGN KEY (`guest_id`) REFERENCES `guests` (`guest_id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_fk_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE CASCADE
) ;

CREATE TABLE `complaints` (
  `complaint_id` int(11) NOT NULL AUTO_INCREMENT,
  `guest_id` int(11) NOT NULL,
  `staff_id` int(11) DEFAULT NULL, 
  `complaint_text` text DEFAULT NULL,
  `complaint_date` timestamp NOT NULL DEFAULT current_timestamp(), 
  `status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`complaint_id`),
  KEY `complaints_fk_guest_idx` (`guest_id`),
  KEY `complaints_fk_staff_idx` (`staff_id`),
  CONSTRAINT `complaints_fk_guest` FOREIGN KEY (`guest_id`) REFERENCES `guests` (`guest_id`) ON DELETE CASCADE,
  CONSTRAINT `complaints_fk_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE
) ;

CREATE TABLE `eventbookings` (
  `event_id` int(11) NOT NULL AUTO_INCREMENT,
  `guest_id` int(11) DEFAULT NULL, -- Modified to allow NULL
  `staff_id` int(11) DEFAULT NULL, -- Modified to allow NULL
  `event_date` date DEFAULT NULL,
  `event_type` varchar(50) DEFAULT NULL,
  `details` text DEFAULT NULL,
  PRIMARY KEY (`event_id`),
  KEY `eventbookings_fk_guest_idx` (`guest_id`),
  KEY `eventbookings_fk_staff_idx` (`staff_id`),
  CONSTRAINT `eventbookings_fk_guest` FOREIGN KEY (`guest_id`) REFERENCES `guests` (`guest_id`) ON DELETE CASCADE,
  CONSTRAINT `eventbookings_fk_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE
) ;

CREATE TABLE `feedback` (
  `feedback_id` int(11) NOT NULL AUTO_INCREMENT,
  `guest_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `feedback_date` date DEFAULT NULL,
  PRIMARY KEY (`feedback_id`),
  KEY `feedback_fk_guest_idx` (`guest_id`),
  KEY `feedback_fk_booking_idx` (`booking_id`),
  CONSTRAINT `feedback_fk_guest` FOREIGN KEY (`guest_id`) REFERENCES `guests` (`guest_id`) ON DELETE CASCADE,
  CONSTRAINT `feedback_fk_booking2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE
) ;

CREATE TABLE `housekeeping` (
  `task_id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `task_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `task_description` varchar(50) DEFAULT NULL, -- Added later
  PRIMARY KEY (`task_id`),
  KEY `housekeeping_fk_staff_idx` (`staff_id`),
  KEY `housekeeping_fk_room_idx` (`room_id`),
  CONSTRAINT `housekeeping_fk_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE,
  CONSTRAINT `housekeeping_fk_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE CASCADE
) ;

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) NOT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `payments_fk_booking_idx` (`booking_id`),
  CONSTRAINT `payments_fk_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE
);

CREATE TABLE `roomserviceorders` (
  `order_id` int(11) NOT NULL AUTO_INCREMENT,
  `guest_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `order_date` date DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `order_status` varchar(20) NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (`order_id`),
  KEY `roomserviceorders_fk_guest_idx` (`guest_id`),
  KEY `roomserviceorders_fk_room_idx` (`room_id`),
  CONSTRAINT `roomserviceorders_fk_guest` FOREIGN KEY (`guest_id`) REFERENCES `guests` (`guest_id`) ON DELETE CASCADE,
  CONSTRAINT `roomserviceorders_fk_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE CASCADE
);

CREATE TABLE `order_items` (
  `order_item_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price_per_item` decimal(10,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `order_items_fk_order_idx` (`order_id`),
  CONSTRAINT `order_items_fk_order` FOREIGN KEY (`order_id`) REFERENCES `roomserviceorders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_chk_quantity` CHECK (`quantity` > 0)
) ;

CREATE TABLE `servicerequests` (
  `request_id` int(11) NOT NULL AUTO_INCREMENT,
  `guest_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `request_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  KEY `servicerequests_fk_guest_idx` (`guest_id`),
  KEY `servicerequests_fk_service_idx` (`service_id`),
  CONSTRAINT `servicerequests_fk_guest` FOREIGN KEY (`guest_id`) REFERENCES `guests` (`guest_id`) ON DELETE CASCADE,
  CONSTRAINT `servicerequests_fk_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`service_id`) ON DELETE CASCADE
);

INSERT INTO `guests` (`guest_id`, `first_name`, `last_name`, `email`, `phone`, `password`) VALUES
(1, 'Aarav', 'Sharma', 'aarav.sharma@email.com', '9876543210', 'guestpass1'),
(2, 'Vivaan', 'Verma', 'vivaan.verma@email.com', '9876543211', 'guestpass2'),
(3, 'Aditya', 'Singh', 'aditya.singh@email.com', '9876543212', 'guestpass3'),
(4, 'Vihaan', 'Kumar', 'vihaan.kumar@email.com', '9876543213', 'guestpass4'),
(5, 'Arjun', 'Das', 'arjun.das@email.com', '9876543214', 'guestpass5'),
(6, 'Sai', 'Patel', 'sai.patel@email.com', '9876543215', 'guestpass6'),
(7, 'Reyansh', 'Gupta', 'reyansh.gupta@email.com', '9876543216', 'guestpass7'),
(8, 'Ayaan', 'Jain', 'ayaan.jain@email.com', '9876543217', 'guestpass8'),
(9, 'Krishna', 'Mehta', 'krishna.mehta@email.com', '9876543218', 'guestpass9'),
(10, 'Ishaan', 'Reddy', 'ishaan.reddy@email.com', '9876543219', 'guestpass10'),
(11, 'Saanvi', 'Malhotra', 'saanvi.malhotra@email.com', '9876543220', 'guestpass11'),
(12, 'Aanya', 'Chopra', 'aanya.chopra@email.com', '9876543221', 'guestpass12'),
(13, 'Myra', 'Agarwal', 'myra.agarwal@email.com', '9876543222', 'guestpass13'),
(14, 'Aarohi', 'Bose', 'aarohi.bose@email.com', '9876543223', 'guestpass14'),
(15, 'Ananya', 'Nair', 'ananya.nair@email.com', '9876543224', 'guestpass15');

INSERT INTO `staff` (`staff_id`, `first_name`, `last_name`, `role`, `email`, `phone`, `salary`, `shift`, `hired_date`) VALUES
(1, 'Rohan', 'Joshi', 'Manager', 'rohan.joshi@hotel.com', '8888888801', 65000.00, 'Morning', '2022-01-15'),
(2, 'Priya', 'Shah', 'Receptionist', 'priya.shah@hotel.com', '8888888802', 35000.00, 'Morning', '2022-05-20'),
(3, 'Amit', 'Patil', 'Housekeeping', 'amit.patil@hotel.com', '8888888803', 28000.00, 'Morning', '2022-06-01'),
(4, 'Sneha', 'Rao', 'Receptionist', 'sneha.rao@hotel.com', '8888888804', 36000.00, 'Evening', '2022-08-10'),
(5, 'Vikram', 'Chatterjee', 'Manager', 'vikram.chatterjee@hotel.com', '8888888805', 70000.00, 'Day', '2021-11-01'),
(6, 'Neha', 'Desai', 'Housekeeping', 'neha.desai@hotel.com', '8888888806', 29000.00, 'Evening', '2023-01-05'),
(7, 'Rahul', 'Iyer', 'Housekeeping', 'rahul.iyer@hotel.com', '8888888807', 28500.00, 'Night', '2023-03-12'),
(8, 'Pooja', 'Menon', 'Receptionist', 'pooja.menon@hotel.com', '8888888808', 35500.00, 'Night', '2023-04-01'),
(9, 'Suresh', 'Nayak', 'Housekeeping', 'suresh.nayak@hotel.com', '8888888809', 27500.00, 'Day', '2023-07-22'),
(10, 'Deepika', 'Pandey', 'Manager', 'deepika.pandey@hotel.com', '8888888810', 68000.00, 'Day', '2022-09-01');

INSERT INTO `rooms` (`room_id`, `room_type`, `description`, `available`, `price`, `capacity`) VALUES
(1, 'Standard', 'Cozy standard room, city view', 1, 3500.00, 2),
(2, 'Deluxe', 'Spacious deluxe room with balcony', 1, 5500.00, 2),
(3, 'Luxury', 'Luxury room with premium amenities', 1, 7500.00, 3),
(4, 'Suite', 'Executive suite with separate living area', 1, 12000.00, 4),
(5, 'Standard', 'Standard room, garden view', 1, 3600.00, 2),
(6, 'Deluxe', 'Deluxe room with king bed', 0, 5800.00, 2), -- Made unavailable
(7, 'Luxury', 'Luxury corner room with panoramic view', 1, 8000.00, 3),
(8, 'Suite', 'Junior suite with modern decor', 1, 10500.00, 3),
(9, 'Standard', 'Accessible standard room', 1, 3550.00, 2),
(10, 'Deluxe', 'Deluxe twin room', 1, 5600.00, 2);

INSERT INTO `services` (`service_id`, `service_name`, `description`, `price`) VALUES
(1, 'Laundry Service', 'Standard laundry and dry cleaning', 500.00),
(2, 'Airport Transfer', 'Sedan transfer to/from DEL airport', 2500.00),
(3, 'Spa - Massage', '60-minute Swedish massage', 3000.00),
(4, 'Gym Access', 'Daily access to fitness center', 0.00), -- Example free service
(5, 'Business Center', 'Printing and copying services', 100.00);

INSERT INTO `inventory` (`item_id`, `item_name`, `quantity`, `description`) VALUES
(1, 'Shampoo Mini Bottle', 500, 'Guest bathroom amenity'),
(2, 'Soap Bar', 600, 'Guest bathroom amenity'),
(3, 'Towels - Bath', 250, 'Standard bath towels'),
(4, 'Water Bottle 500ml', 1000, 'Complimentary guest water'),
(5, 'Room Service Menu', 150, 'In-room dining menu card');

INSERT INTO `offers` (`offer_id`, `description`, `discount_percentage`, `start_date`, `end_date`) VALUES
(1, 'Monsoon Getaway Discount', 15.00, '2024-07-01', '2024-09-30'),
(2, 'Diwali Special - Stay 3 Nights Pay 2', 33.33, '2024-10-15', '2024-11-15');

insert into admin (admin_id, username,password) values
(3,'shreyas','1234');
select * from admin;

INSERT INTO `bookings` (`booking_id`, `guest_id`, `room_id`, `booking_date`, `check_in`, `check_out`, `status`) VALUES
(1, 1, 2, '2024-05-01', '2024-07-10', '2024-07-15', 'Checked-out'),
(2, 3, 5, '2024-05-10', '2024-07-12', '2024-07-14', 'Checked-out'),
(3, 5, 7, '2024-06-01', '2024-07-20', '2024-07-25', 'Checked-in'),
(4, 2, 1, '2024-06-15', '2024-08-01', '2024-08-05', 'Confirmed'),
(5, 4, 6, '2024-06-20', '2024-08-02', '2024-08-04', 'Confirmed'), 
(6, 6, 3, '2024-07-01', '2024-08-10', '2024-08-15', 'Confirmed'),
(7, 8, 9, '2024-07-05', '2024-08-11', '2024-08-13', 'Confirmed'),
(8, 10, 4, '2024-07-10', '2024-09-01', '2024-09-10', 'Confirmed'),
(9, 7, 8, '2024-07-15', '2024-09-05', '2024-09-08', 'Confirmed'),
(10, 9, 10, '2024-07-20', '2024-09-15', '2024-09-20', 'Confirmed');

INSERT INTO `payments` (`payment_id`, `booking_id`, `amount`, `payment_date`, `payment_method`) VALUES
(1, 1, 27500.00, '2024-07-15', 'Card'), 
(2, 2, 7200.00, '2024-07-14', 'UPI'),   
(3, 3, 20000.00, '2024-07-20', 'Card'), 
(4, 4, 14000.00, '2024-06-15', 'PayPal'),
(5, 5, 11600.00, '2024-06-20', 'UPI');    

INSERT INTO `feedback` (`feedback_id`, `guest_id`, `booking_id`, `rating`, `comment`, `feedback_date`) VALUES
(1, 1, 1, 4, 'Great stay, lovely balcony view.', '2024-07-16'),
(2, 3, 2, 5, 'Very comfortable room and excellent service.', '2024-07-15'),
(3, 1, 1, 3, 'AC was a bit noisy, but otherwise fine.', '2024-07-17');

INSERT INTO `roomserviceorders` (`order_id`, `guest_id`, `room_id`, `order_date`, `total_amount`, `order_status`) VALUES
(1, 1, 2, '2024-07-11', 0.00, 'Delivered'), 
(2, 3, 5, '2024-07-13', 0.00, 'Delivered'),
(3, 5, 7, '2024-07-21', 0.00, 'Pending'),
(4, 5, 7, '2024-07-22', 0.00, 'Preparing');

INSERT INTO `order_items` (`order_item_id`, `order_id`, `item_name`, `quantity`, `price_per_item`) VALUES
(1, 1, 'Club Sandwich', 2, 450.00),
(2, 1, 'Fresh Lime Soda', 2, 150.00),
(3, 2, 'Butter Chicken', 1, 650.00),
(4, 2, 'Garlic Naan', 2, 120.00),
(5, 2, 'Mineral Water', 1, 80.00),
(6, 3, 'Vegetable Biryani', 1, 550.00),
(7, 3, 'Coke', 2, 100.00);

INSERT INTO `housekeeping` (`task_id`, `staff_id`, `room_id`, `task_date`, `status`, `task_description`) VALUES
(1, 3, 1, '2024-07-10', 'Completed', 'Standard cleaning post checkout'),
(2, 6, 7, '2024-07-22', 'Pending', 'Daily room tidy up'),
(3, 7, 4, '2024-07-23', 'Pending', 'Prepare room for arrival'),
(4, 9, 10, '2024-07-24', 'Pending', 'Deep clean scheduled'),
(5, 3, 2, '2024-07-15', 'Completed', 'Standard cleaning post checkout');


INSERT INTO `complaints` (`complaint_id`, `guest_id`, `staff_id`, `complaint_text`, `complaint_date`, `status`) VALUES
(1, 5, 4, 'Check-in took longer than expected at the front desk.', '2024-07-20 14:30:00', 'Pending'),
(2, 1, 7, 'Room service delivery was slow on the 11th night.', '2024-07-12 10:00:00', 'Resolved');

INSERT INTO `eventbookings` (`event_id`, `guest_id`, `staff_id`, `event_date`, `event_type`, `details`) VALUES
(1, 8, 5, '2024-08-20', 'Conference', 'Booking for Agarwal Industries annual meet, 50 pax'),
(2, NULL, 1, '2024-12-15', 'Wedding', 'Booking for Sharma-Verma wedding reception, 200 guests'); -- Example without a specific guest ID yet

INSERT INTO `servicerequests` (`request_id`, `guest_id`, `service_id`, `request_date`, `status`) VALUES
(1, 1, 1, '2024-07-11', 'Completed'),
(2, 5, 2, '2024-07-24', 'Pending'),
(3, 3, 3, '2024-07-13', 'Completed'), 
(4, 6, 4, '2024-08-11', 'Completed');


