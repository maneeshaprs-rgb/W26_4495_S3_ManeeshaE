Student name : Maneesha Eeshwara
Student Id : 300392759
Project Name : FarmVendor application
project description

FarmVendor is a role-based web application designed to help farmers and vendors coordinate product supply and demand more effectively. The application allows farmers to manage available products and inventory, while vendors can submit demand requests specifying required quantities and delivery dates.

The system supports demand forecasting by analyzing vendor requests together with past dispatch data, helping farmers plan their harvest and delivery decisions. It also provides vendor recommendations based on distance, requested quantity, and historical relationships, while allowing farmers to make the final decision.

The backend is built using ASP.NET Core Web API with secure authentication and role-based access control. SQL Server is used for data storage, and React is used for the frontend. During early stages, the application uses simulated data to support development and applied research.

Installation instructions
Repository : https://github.com/maneeshaprs-rgb/W26_4495_S3_ManeeshaE.git
•	Backend
    1.	Cd FarmVendor\FarmVendor.Api
    2.	dotnet restore
    3.	dotnet run
    4.	.net db creation steps from migration files
          o	dotnet tool install --global dotnet-ef  
          o	dotnet ef database update
          o	dotnet run
•	Frontend
    1.	Cd farmvendor-web
    2.	Npm install
    3.	npm run dev  
    4.	Create .env file inside farmvendor-web and paste below content
        a.	VITE_API_URL=http://localhost:5136
•	Database connection
      1.	Open Extensions => SQL Server (mssql)=>install
      2.	Ctrl + Shift + P => MS SQL: Connect
      3.	Connection details: 
          Server name: (localdb)\MSSQLLocalDB
          Authentication: Windows Authentication
          Trust server certificate :yes
4.	 See database via sql queries folder inside reports and documents folder	


