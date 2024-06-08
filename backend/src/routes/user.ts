import { Hono } from "hono";
import { Prisma, PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from 'hono/jwt'
import { signupInput, signinInput } from "@sgrsngh/medium-common";

export const userRouter = new Hono<{
    Bindings: {
     DATABASE_URL: string ,
     JWT_SECRET: string
    }
}>()

userRouter.post('/signup', async(c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    
    const body = await c.req.json();
    const { success } = signupInput.safeParse(body);
    if(!success){
      c.status(411);
      return c.json({
        message: 'input are incorrect'
      })
    }
  
    try{
      const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
        name: body.name
      }
    })
    
    const token =await sign({id: user.id},c.env.JWT_SECRET)
    return c.json({
      jwt:token
    })
  
    }catch(e){
      console.log(e);
      c.status(411);
      c.text('invalid')
    }
   
})
  
userRouter.post('/signin', async(c) => {
  
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    const body = await c.req.json();  
    const { success } = signinInput.safeParse(body);
    if(!success){
      c.status(411)
      return c.json({
        message: 'input are incorrect'
      })
    }
    
    try{
      const user = await prisma.user.findUnique({
        where: {
          email: body.email,
          password: body.password,
        }
      })
  
      if(!user){
        return c.json({
          error:'user does not exist'
        })
      }else{const token = await sign({id: user.id},c.env.JWT_SECRET)
        return c.json({
          jwt: token 
        })
      }
    }catch(e){
      console.log(e)
        c.status(411);
        c.text("invalid")
      
    }
})
