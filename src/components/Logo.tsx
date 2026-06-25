import logo from './logo.png'

interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export default function Logo({
  size = 64,
  showText = true,
  className = '',
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        style={{
          width: size,
          height: size,
        }}
        className="flex items-center justify-center"
      >
        <img
          src={logo}
          alt="Logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      {showText && (
        <span className="text-xl font-semibold tracking-tight">
          GPI Sistemas
        </span>
      )}
    </div>
  )
}