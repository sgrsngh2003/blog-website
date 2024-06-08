import { Hono } from "hono";
import { Prisma, PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { createPostInput, updatePostInput } from "@sgrsngh/medium-common";

export const blogRoute = new Hono<{
    Bindings: {
     DATABASE_URL: string ,
     JWT_SECRET: string
    },
    Variables: {
      userId:string
    }
}>();

blogRoute.use('/*', async (c,next) => {
  
    const authHeader = c.req.header('authorization') || '';
    
    const user = await verify(authHeader,c.env.JWT_SECRET);
    if(user){
      c.set('userId',user.id)
      await next();
    }else{
      return c.json({
        error:"unauthorized"
      })
    }
});
  
  
  
blogRoute.post('/', async(c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const body = await c.req.json();
    const authorId = c.get('userId')

    const { success } = createPostInput.safeParse(body);
    if(!success){
      c.status(411);
      return c.json({
        message: 'input are incorrect'
      })
    }
  
    const create = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: authorId
      }
    })
   
    return c.json({
      create: create.id
    })
  })
  
blogRoute.put('/', async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())
      const body = await c.req.json();
    
    const { success } = updatePostInput.safeParse(body);
      if(!success){
        c.status(411);
        return c.json({
          message: 'input are incorrect'
        })
    }

    const update = await prisma.post.update({
        where: {
            id: body.id
        },
        data: {
            title: body.title,
            content: body.content
        }
    })

    return c.json({
        id: update.id
    })

})
  
blogRoute.get('/bulk', async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())

    const blog = await prisma.post.findMany({
      select: {
        content: true,
        title: true,
        id: true,
        author: {
          select: {
            name: true
          }
        }
      }
    })
    return c.json({
        blog
    })
})
  
blogRoute.get('/:id', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())
    
    const id = c.req.param('id');

    try{
        const blog = await prisma.post.findFirst({
            where: {
                id: id
            },
            select: {
              content: true,
              title: true,
              id: true,
              author: {
                select: {
                  name: true 
                }
              }
            }
        })
        return c.json({
            blog
        })
    }catch(e){
        c.status(411);
        return c.json({
            message: "not found"
        })
    }
})

  