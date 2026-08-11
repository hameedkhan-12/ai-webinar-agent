'use client'

/**
 * SVG brand icons for each integration.
 * Using inline SVG for zero external dependency and instant load.
 */

type IconProps = {
  id: string
  color: string
  size?: number
}

export function IntegrationIcon({ id, color, size = 24 }: IconProps) {
  const s = size

  switch (id) {
    case 'hubspot':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.164 7.934V5.696a1.56 1.56 0 0 0 .904-1.415V4.25a1.564 1.564 0 0 0-3.128 0v.031a1.56 1.56 0 0 0 .905 1.415v2.238a4.439 4.439 0 0 0-2.1.917L7.96 4.223a1.74 1.74 0 0 0 .068-.477 1.752 1.752 0 1 0-1.752 1.752c.322 0 .62-.094.875-.25l6.7 4.35a4.46 4.46 0 0 0-.576 2.195c0 .86.245 1.66.667 2.338l-2.04 2.04a1.39 1.39 0 0 0-.406-.063 1.41 1.41 0 1 0 1.41 1.41 1.39 1.39 0 0 0-.063-.406l2.015-2.015a4.46 4.46 0 0 0 2.65.862 4.476 4.476 0 0 0 .656-8.025zm-.656 6.302a2.748 2.748 0 1 1 0-5.497 2.748 2.748 0 0 1 0 5.497z" fill={color} />
        </svg>
      )

    case 'gohighlevel':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill={color} fillOpacity="0.15" />
          <path d="M12 4L4 8.5V15.5L12 20L20 15.5V8.5L12 4Z" fill={color} />
          <path d="M12 8L8 10.5V13.5L12 16L16 13.5V10.5L12 8Z" fill="white" fillOpacity="0.9" />
        </svg>
      )

    case 'activecampaign':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 12.5L10 6L22 14.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 15.5L10 12.5L18 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </svg>
      )

    case 'mailchimp':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.924 12.386c.16-.434.23-.893.205-1.352a3.272 3.272 0 0 0-1.12-2.268 4.212 4.212 0 0 0-.403-3.11C18.673 4.378 17.2 3.6 15.465 3.6c-.62 0-1.235.13-1.8.38a3.463 3.463 0 0 0-2.328-.903 3.52 3.52 0 0 0-2.667 1.225 4.48 4.48 0 0 0-2.39 1.215A4.578 4.578 0 0 0 4.9 9.073a3.57 3.57 0 0 0-.86 4.8 3.44 3.44 0 0 0 .424 3.953 3.65 3.65 0 0 0 3.21 1.16 3.476 3.476 0 0 0 2.575 1.15h.024a3.507 3.507 0 0 0 2.558-1.085 5.16 5.16 0 0 0 1.77.32c1.073 0 2.1-.33 2.96-.95a4.717 4.717 0 0 0 1.787-2.538 3.39 3.39 0 0 0 1.574-3.497z" fill={color} fillOpacity="0.9" />
          <circle cx="9.5" cy="11.5" r="1" fill="white" />
          <circle cx="14.5" cy="11.5" r="1" fill="white" />
          <path d="M10.5 14.5c.5.8 2.5.8 3 0" stroke="white" strokeWidth="1" strokeLinecap="round" />
        </svg>
      )

    case 'convertkit':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6H20M4 12H14M4 18H17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="19" cy="12" r="2.5" fill={color} />
        </svg>
      )

    case 'zapier':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.003 3.335a.668.668 0 0 0-.668.668v4.914L7.77 5.352a.668.668 0 0 0-.944.944l3.565 3.565H5.477a.668.668 0 0 0 0 1.336h4.914l-3.565 3.565a.668.668 0 1 0 .944.944l3.565-3.565v4.914a.668.668 0 1 0 1.336 0v-4.914l3.565 3.565a.668.668 0 1 0 .944-.944L13.615 11.2h4.914a.668.668 0 1 0 0-1.336h-4.914l3.565-3.565a.668.668 0 0 0-.944-.944L12.67 8.92V4.003a.668.668 0 0 0-.668-.668z" fill={color} />
        </svg>
      )

    case 'slack':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill={color} />
        </svg>
      )

    case 'google-sheets':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.727 1.636H5.455A1.455 1.455 0 0 0 4 3.09v17.818A1.455 1.455 0 0 0 5.455 22.4h13.09A1.455 1.455 0 0 0 20 20.91V6.909l-5.273-5.273z" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1" />
          <path d="M14.727 1.636v5.273H20" stroke={color} strokeWidth="1" />
          <line x1="7.636" y1="12" x2="16.364" y2="12" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="7.636" y1="15.273" x2="16.364" y2="15.273" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="7.636" y1="18.545" x2="12.727" y2="18.545" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="12" y1="10.182" x2="12" y2="20" stroke={color} strokeWidth="1" strokeLinecap="round" />
        </svg>
      )

    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
          <path d="M9 12h6M12 9v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
  }
}
