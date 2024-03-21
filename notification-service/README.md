# Payie Notification Service

This project provides a Notification Service for Payie built with Node.js, allowing for sending email and SMS notifications. It leverages Nodemailer for email sending and Twilio for SMS sending.

## Features

- Send email notifications using SMTP settings.
- Send SMS notifications using Twilio API.
- Easy integration with the Payie payment applications.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- NodeJS version 18.17.0 or higher
- Yarn 1.22.9 or higher OR NPM version 10.3.0 or higher
- SMTP credentials for sending emails.
- Twilio account with SID, Auth Token, and a Twilio phone number for sending SMS.
- Testing: Jest for NodeJS
- Version Control: Git

## Installation

Clone this repository to your local machine:

```bash
git clone https://github.com/Cank256/payie_node.git
cd notification-service
```

Install the required dependencies:
```bash
npm install
```

## Configuration

Create a .env file in the root directory and add your APP details and Database credentials:

```makefile
# App Configuration
APP_API_KEY=""
APP_WEBHOOK_KEY=""
APP_AUTHORIZED_IPS=["::ffff:127.0.0.1","::1"]
APP_PORT=8080

# Database Configuration
DB_LINK="mongodb://localhost:27017/notifications"
DB_PORT=27017
DB_TRANSACTIONS_COLLECTION=notifications
DB_MESSAGES_COLLECTION=messages

```

Note: Add provider details to the provider.json file as well.

## Usage
To use the notification service in your project, you can import the sendEmail and sendSMS functions:

```javascript
const { sendEmail } = require('./emailService');
const { sendSMS } = require('./smsService');

// Send an email
sendEmail('recipient@example.com', 'Test Email', 'Hello, this is a test email from our notification service.');

// Send an SMS
sendSMS('+1234567890', 'Hello, this is a test message from our notification service.');
```

## Contributing

See [Project README](../README.md) for contribution instructions

## License

 See the [LICENSE](../LICENSE) file in the root folder for more details.