import type {MetadataRoute} from 'next';
import {zereca} from '@/components/zereca-brand';
export default function sitemap():MetadataRoute.Sitemap{return ['', '/basic', '/work'].map(path=>({url:`${zereca.origin}${path}`,changeFrequency:'monthly',priority:path? .7:1}));}
