import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			inter: [
  				'var(--font-inter)',
                    ...fontFamily.sans
                ]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'collapsible-down': {
  				from: {
  					height: '0',
  					opacity: '0'
  				},
  				to: {
  					height: 'var(--radix-collapsible-content-height)',
  					opacity: '1'
  				}
  			},
  			'collapsible-up': {
  				from: {
  					height: 'var(--radix-collapsible-content-height)',
  					opacity: '1'
  				},
  				to: {
  					height: '0',
  					opacity: '0'
  				}
  			},
  			'top-bidder-glow': {
  				'0%, 100%': {
  					opacity: '0.45',
  					transform: 'scale(0.92)'
  				},
  				'50%': {
  					opacity: '1',
  					transform: 'scale(1.08)'
  				}
  			},
  			'top-bidder-float': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-6px)' }
  			},
  			'encouragement-rocket': {
  				'0%, 100%': { transform: 'translateY(0) rotate(-8deg)' },
  				'35%': { transform: 'translateY(-10px) rotate(8deg)' },
  				'70%': { transform: 'translateY(-4px) rotate(-4deg)' }
  			},
  			'encouragement-wiggle': {
  				'0%, 100%': { transform: 'rotate(-2deg) scale(1)' },
  				'25%': { transform: 'rotate(2deg) scale(1.05)' },
  				'50%': { transform: 'rotate(-2deg) scale(1)' },
  				'75%': { transform: 'rotate(2deg) scale(1.05)' }
  			},
  			'encouragement-sparkle': {
  				'0%, 100%': { opacity: '0.35', transform: 'scale(0.85)' },
  				'50%': { opacity: '1', transform: 'scale(1.15)' }
  			},
  			'encouragement-dash': {
  				'0%': { transform: 'translateX(0)', opacity: '0.6' },
  				'100%': { transform: 'translateX(12px)', opacity: '0' }
  			},
  			'hero-badge-bounce': {
  				'0%, 100%': { transform: 'rotate(-4deg) scale(1)' },
  				'30%': { transform: 'rotate(4deg) scale(1.06)' },
  				'60%': { transform: 'rotate(-2deg) scale(0.98)' }
  			},
  			'hero-badge-shine': {
  				'0%, 100%': { opacity: '0.5' },
  				'50%': { opacity: '1' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'collapsible-down': 'collapsible-down 0.25s ease-out',
  			'collapsible-up': 'collapsible-up 0.3s ease-in-out',
  			'top-bidder-glow': 'top-bidder-glow 2.4s ease-in-out infinite',
  			'top-bidder-float': 'top-bidder-float 3s ease-in-out infinite',
  			'encouragement-rocket': 'encouragement-rocket 1.6s ease-in-out infinite',
  			'encouragement-wiggle': 'encouragement-wiggle 0.8s ease-in-out infinite',
  			'encouragement-sparkle': 'encouragement-sparkle 1.2s ease-in-out infinite',
  			'encouragement-dash': 'encouragement-dash 1s ease-out infinite',
  			'hero-badge-bounce': 'hero-badge-bounce 1.4s ease-in-out infinite',
  			'hero-badge-shine': 'hero-badge-shine 1.8s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
