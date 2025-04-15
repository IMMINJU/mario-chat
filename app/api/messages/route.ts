import { NextResponse } from "next/server"

// 실제 애플리케이션에서는 데이터베이스에서 메시지를 가져와야 합니다.
// 이 예제에서는 간단한 메모리 내 메시지 배열을 사용합니다.
const messages = [
  {
    id: "1",
    text: "안녕하세요! 채팅방에 오신 것을 환영합니다.",
    sender: "system",
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: "2",
    text: "질문이 있으시면 언제든지 물어보세요.",
    sender: "system",
    timestamp: new Date(Date.now() - 1800000),
  },
]

export async function GET() {
  // 실제 애플리케이션에서는 데이터베이스 쿼리를 수행합니다.
  return NextResponse.json(messages)
}
