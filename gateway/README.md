# Payie NodeJS Gateway

Gateway for the Payie payments project. This nhandles the basic interaction between payie and 
third party payment service providers (i.e. Airtel UG, Flutterwave and MTN UG).

## Tech Used
- NodeJS version 18.17.0 or higher
- Yarn 1.22.9 or higher OR NPM version 10.3.0 or higher
- Database: MongoDB
- Caching: REDIS
- External API: Momo API UG, Airtel Money, Flutterwave Card payment
- Testing: Jest for Vue.js, Unit Testing for Flask
- Version Control: Git

## Local Development Setup
To set up payie gateway on your local machine make sure you have the above tech specs installed,
then follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/Cank256/payie_node.git
   ```
2. Enter the Gateway directory
   ```
   cd gateway
   ```
3. Install Node Modules
   ```
   yarn install
   ```
   OR
   ```
   npm install
   ```
4. Start the MongoDB service on your machine.
5. Run the Redis server.
8. Run the development server:
   ```
   yarn dev
   ```
   OR
   ```
   npm run dev
   ```

## Authors

- [Caleb Nkunze](https://www.github.com/Cank256)

## Contributing

See [Project README](../README.md) for contribution instructions

## License

 See the [LICENSE](../LICENSE) file in the root folder for more details.