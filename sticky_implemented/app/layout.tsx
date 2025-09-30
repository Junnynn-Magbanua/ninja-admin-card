import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* RudderStack Tracking Code */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              !function(){"use strict";window.RudderSnippetVersion="3.2.0";var e="rudderanalytics";window[e]||(window[e]=[])
              ;var rudderanalytics=window[e];if(Array.isArray(rudderanalytics)){
              if(true===rudderanalytics.snippetExecuted&&window.console&&console.error){
              console.error("RudderStack JavaScript SDK snippet included more than once.")}else{rudderanalytics.snippetExecuted=true,
              window.rudderAnalyticsBuildType="legacy";var sdkBaseUrl="https://cdn.rudderlabs.com";var sdkVersion="v3"
              ;var sdkFileName="rsa.min.js";var scriptLoadingMode="async"
              ;var r=["setDefaultInstanceKey","load","ready","page","track","identify","alias","group","reset","setAnonymousId","startSession","endSession","consent","addCustomIntegration"]
              ;for(var n=0;n<r.length;n++){var t=r[n];rudderanalytics[t]=function(r){return function(){var n
              ;Array.isArray(window[e])?rudderanalytics.push([r].concat(Array.prototype.slice.call(arguments))):null===(n=window[e][r])||void 0===n||n.apply(window[e],arguments)
              }}(t)}try{
              new Function('class Test{field=()=>{};test({prop=[]}={}){return prop?(prop?.property??[...prop]):import("");}}'),
              window.rudderAnalyticsBuildType="modern"}catch(i){}var d=document.head||document.getElementsByTagName("head")[0]
              ;var o=document.body||document.getElementsByTagName("body")[0];window.rudderAnalyticsAddScript=function(e,r,n){
              var t=document.createElement("script");t.src=e,t.setAttribute("data-loader","RS_JS_SDK"),r&&n&&t.setAttribute(r,n),
              "async"===scriptLoadingMode?t.async=true:"defer"===scriptLoadingMode&&(t.defer=true),
              d?d.insertBefore(t,d.firstChild):o.insertBefore(t,o.firstChild)},window.rudderAnalyticsMount=function(){!function(){
              if("undefined"==typeof globalThis){var e;var r=function getGlobal(){
              return"undefined"!=typeof self?self:"undefined"!=typeof window?window:null}();r&&Object.defineProperty(r,"globalThis",{
              value:r,configurable:true})}
              }(),window.rudderAnalyticsAddScript("".concat(sdkBaseUrl,"/").concat(sdkVersion,"/").concat(window.rudderAnalyticsBuildType,"/").concat(sdkFileName),"data-rsa-write-key","33G5mwfEygQbG9cXZCM3c1x3AdP")
              },
              "undefined"==typeof Promise||"undefined"==typeof globalThis?window.rudderAnalyticsAddScript("https://polyfill-fastly.io/v3/polyfill.min.js?version=3.111.0&features=Symbol%2CPromise&callback=rudderAnalyticsMount"):window.rudderAnalyticsMount()
              ;var loadOptions={};rudderanalytics.load("33G5mwfEygQbG9cXZCM3c1x3AdP","https://tryninjajhucwe.dataplane.rudderstack.com",loadOptions)}}}();
            `
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-P6ZXD83L');`
        }} />
        <noscript>
          <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P6ZXD83L"
            height="0" width="0" style={{display:'none',visibility:'hidden'}}></iframe>
        </noscript>
        {/*End Google Tag Manager*/}
        {children}
        <Analytics />
      </body>
    </html>
  )
}
