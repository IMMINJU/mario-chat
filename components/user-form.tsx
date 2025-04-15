"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import MarioAvatar from "./mario-avatar"
import type { MarioCharacter } from "@/types/chat"

interface UserFormProps {
  onSubmit: (data: { username: string; character: MarioCharacter }) => void
  defaultCharacter?: MarioCharacter
}

interface FormValues {
  username: string
  character: MarioCharacter
}

export default function UserForm({ onSubmit, defaultCharacter = "mario" }: UserFormProps) {
  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      username: "",
      character: defaultCharacter,
    },
  })

  const selectedCharacter = watch("character")

  const handleCharacterSelect = (character: MarioCharacter) => {
    setValue("character", character)
  }

  const characters: MarioCharacter[] = ["mario", "luigi", "toad", "peach", "bowser", "yoshi"]

  return (
    <Card className="mario-card bg-mario-beige pixel-corners">
      <CardHeader className="bg-mario-red text-white font-mario text-center text-sm md:text-base">
        Character Selection
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="font-mario text-xs md:text-sm text-mario-black" htmlFor="username">
              Nickname
            </label>
            <Input
              id="username"
              {...register("username", { required: true })}
              className="border-mario-black border-2 font-mario text-xs"
              placeholder="Enter your nickname"
              aria-required="true"
            />
          </div>

          <div className="space-y-2">
            <label className="font-mario text-xs md:text-sm text-mario-black">Character</label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select character">
              {characters.map((char) => (
                <div key={char} className="cursor-pointer">
                  <input
                    type="radio"
                    id={`character-${char}`}
                    value={char}
                    {...register("character")}
                    className="sr-only"
                    onChange={() => handleCharacterSelect(char)}
                    aria-checked={selectedCharacter === char}
                  />
                  <label
                    htmlFor={`character-${char}`}
                    className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                      char === selectedCharacter ? "bg-mario-blue text-white" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <MarioAvatar character={char} size="lg" />
                    <span className="mt-2 font-mario text-[10px] capitalize">{char}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mario-button bg-mario-green hover:bg-mario-green/90 text-white font-mario text-xs"
          >
            Start Game!
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
