# Attendance Portal - Render Deployment Guide

This guide will help you deploy the Attendance Portal to Render.com.

## Prerequisites

1. A GitHub account
2. A Render.com account (free tier available)
3. Your project code pushed to a GitHub repository

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your project is pushed to GitHub with the following files:
- `app.py` (main Flask application)
- `requirements.txt` (Python dependencies)
- `runtime.txt` (Python version specification)
- `render.yaml` (Render configuration)
- `Procfile` (process configuration)
- `env.example` (environment variables template)

### 2. Deploy to Render

#### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "Blueprint"
3. Connect your GitHub repository
4. Select the repository containing your project
5. Render will automatically detect the `render.yaml` file
6. Click "Apply" to deploy

#### Option B: Manual Configuration

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Select the repository containing your project
5. Configure the following settings:
   - **Name**: `attendance-portal` (or your preferred name)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free (or upgrade as needed)

### 3. Environment Variables

In the Render dashboard, go to your service's "Environment" tab and add:

```
SECRET_KEY=your-secure-secret-key-here
FLASK_ENV=production
DATABASE_URL=sqlite:///attendance.db
```

**Important**: Generate a strong secret key for production. You can use:
```python
import secrets
print(secrets.token_hex(32))
```

### 4. Database Configuration

The application uses SQLite by default, which is suitable for small to medium deployments. For production with high traffic, consider upgrading to PostgreSQL:

1. In Render dashboard, create a new PostgreSQL database
2. Update the `DATABASE_URL` environment variable with the PostgreSQL connection string
3. Update the database configuration in your code if needed

### 5. File Storage

The application stores uploaded files in the `uploads` directory. On Render's free tier, this is ephemeral storage. For persistent file storage:

1. Consider using Render's persistent disk add-on
2. Or integrate with cloud storage services like AWS S3

### 6. Custom Domain (Optional)

1. In your service settings, go to "Custom Domains"
2. Add your domain name
3. Follow the DNS configuration instructions

## Configuration Files Explained

### render.yaml
Contains the service configuration for automatic deployment:
- Service type: Web service
- Environment: Python
- Build and start commands
- Environment variables
- Disk configuration for file storage

### requirements.txt
Lists all Python dependencies with specific versions for reproducible builds.

### runtime.txt
Specifies the Python version (3.11.10) for Render to use.

### Procfile
Defines the process type and command for the web service.

## Post-Deployment

1. **Test the Application**: Visit your Render URL to ensure the application loads
2. **Admin Login**: Use the default admin credentials:
   - Email: `admin@balarbuilders.com`
   - Password: `admin123`
3. **Upload Data**: Upload your Excel attendance files through the admin interface
4. **Monitor**: Check the Render dashboard for logs and performance metrics

## Troubleshooting

### Common Issues

1. **Build Failures**: Check the build logs in Render dashboard
2. **Database Errors**: Ensure the database is properly initialized
3. **File Upload Issues**: Check file size limits and storage permissions
4. **Memory Issues**: Consider upgrading to a paid plan for more resources

### Logs

Access application logs in the Render dashboard under the "Logs" tab.

### Environment Variables

Verify all required environment variables are set in the "Environment" tab.

## Security Considerations

1. **Change Default Passwords**: Update admin passwords after deployment
2. **Secret Key**: Use a strong, unique secret key
3. **HTTPS**: Render provides HTTPS by default
4. **File Validation**: The application validates uploaded files

## Scaling

- **Free Tier**: Suitable for small teams (up to 5-10 users)
- **Paid Plans**: For larger teams, consider upgrading for better performance
- **Database**: For high traffic, migrate to PostgreSQL
- **File Storage**: Use cloud storage for better reliability

## Support

For issues specific to:
- **Render**: Check [Render Documentation](https://render.com/docs)
- **Application**: Check the application logs and error messages
- **Database**: Verify database configuration and permissions

## Maintenance

1. **Regular Backups**: Export data regularly from the admin interface
2. **Updates**: Keep dependencies updated for security
3. **Monitoring**: Monitor application performance and logs
4. **Security**: Regularly update passwords and review access

---

Your Attendance Portal should now be live on Render! 🚀
