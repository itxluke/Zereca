import type {MetadataRoute} from 'next';
import {zereca} from '@/components/zereca-brand';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',...(process.env.ZERECA_PUBLIC_SITE==='true'?{allow:'/'}:{disallow:'/'})},sitemap:`${zereca.origin}/sitemap.xml`,host:zereca.origin};}
