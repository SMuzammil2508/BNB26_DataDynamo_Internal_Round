import { NextResponse } from " next/server\;
import { prisma } from \@/lib/prisma\;
import { promises as fs } from \fs\;
import path from \path\;

export async function POST(request: Request) {
 const formData = await request.formData();
 const file = formData.get('file') as File;
 if (!file) {
 return NextResponse.json({ error: \No file provided\ }, { status: 400 });
 }

 const uploadDir = path.join(process.cwd(), \public\, \uploads\);
 await fs.mkdir(uploadDir, { recursive: true });

 const arrayBuffer = await file.arrayBuffer();
 const buffer = Buffer.from(arrayBuffer);
 const filePath = path.join(uploadDir, file.name);
 await fs.writeFile(filePath, buffer);

 const urlPath = /uploads/;
 return NextResponse.json({ url: urlPath });
}
