# 📧 Email Setup Guide

This guide will help you configure email services for your authentication boilerplate. Email functionality is essential for user verification, password resets, and notifications.

## 🎯 Overview

Email integration provides:

- **Email Verification**: Confirm user email addresses during registration
- **Password Reset**: Secure password recovery via email links
- **Welcome Emails**: Onboard new users with welcome messages
- **Admin Notifications**: Alert admins about important events
- **Custom Templates**: Branded email templates for your app

## 📋 Prerequisites

- Your Next.js app set up and running
- A domain name (recommended for production)
- Basic understanding of DNS records (for production)

## 🚀 Email Service Options

### Option 1: Resend (Recommended)

- **Best for**: Production applications
- **Pros**: Great deliverability, simple API, generous free tier
- **Free tier**: 3,000 emails/month, 100 emails/day
- **Setup time**: 5-10 minutes

### Option 2: Mock Mode (Development)

- **Best for**: Development and testing
- **Pros**: No setup required, instant testing
- **Cons**: No real emails sent (console logging only)
- **Setup time**: 0 minutes (already configured)

## 🔧 Resend Setup (Production)

### Step 1: Create Resend Account

1. **Sign up for Resend**
   - Visit [resend.com](https://resend.com)
   - Click **"Sign up"**
   - Use your email and create a password
   - Verify your email address

2. **Complete onboarding**
   - Choose your use case: "Transactional emails"
   - Skip team invitation for now

### Step 2: Get API Key

1. **Navigate to API Keys**
   - In Resend dashboard, go to **"API Keys"**
   - Click **"Create API Key"**

2. **Create API Key**
