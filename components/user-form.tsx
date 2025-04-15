"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

// 폼 스키마 정의
const formSchema = z.object({
  username: z.string().min(3, {
    message: "사용자 이름은 최소 3자 이상이어야 합니다.",
  }),
  room: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface UserFormProps {
  onJoin: (username: string, room?: string) => void
}

export default function UserForm({ onJoin }: UserFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      room: "",
    },
  })

  function onSubmit(values: FormValues) {
    onJoin(values.username, values.room)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>채팅 참여하기</CardTitle>
        <CardDescription>채팅에 참여하려면 사용자 이름을 입력하세요.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>사용자 이름</FormLabel>
                  <FormControl>
                    <Input placeholder="사용자 이름을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="room"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>채팅방 (선택사항)</FormLabel>
                  <FormControl>
                    <Input placeholder="채팅방 이름을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              참여하기
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
