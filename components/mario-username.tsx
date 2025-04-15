interface MarioUsernameProps {
  username: string
  isCurrentUser?: boolean
}

export default function MarioUsername({ username, isCurrentUser }: MarioUsernameProps) {
  return (
    <div className="mb-1">
      <span className={`font-mario text-[10px] ${isCurrentUser ? "text-mario-green" : "text-mario-red"}`}>
        {isCurrentUser ? "나" : username}
      </span>
    </div>
  )
}
