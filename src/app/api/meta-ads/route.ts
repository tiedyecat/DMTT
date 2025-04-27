import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { MetaAdsMonitoring } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessName = searchParams.get('business')
    const days = parseInt(searchParams.get('days') || '30')
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    let query = supabase
      .from('meta_ads_monitoring')
      .select('*')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: false })
    
    // Add business name filter if provided
    if (businessName) {
      query = query.ilike('business_name', `%${businessName}%`)
    }
    
    // Execute query
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching Meta ads data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch Meta ads data' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      data: data as MetaAdsMonitoring[],
      timeRange: {
        start: startDateStr,
        end: endDateStr
      }
    })
  } catch (err) {
    console.error('Unexpected error fetching Meta ads data:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 