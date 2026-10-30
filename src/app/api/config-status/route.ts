import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.PAGESPEED_API_KEY?.trim();
  const token = process.env.MATOS_INTERNAL_API_TOKEN?.trim();

  const hasApiKey = Boolean(apiKey && apiKey !== 'your_google_pagespeed_api_key_here');
  const hasToken = Boolean(token && token !== 'your_internal_api_token_here');

  return NextResponse.json({
    hasApiKey,
    hasToken,
    env: process.env.NODE_ENV || 'development',
  });
}
