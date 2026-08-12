import bcrypt from "bcryptjs";
import { Usuario } from "../models/Usuario";
import { Obra } from "../models/Obra";
import data from "./data.json";

export async function seedIfEmpty() {
  const [usuariosCount, obrasCount] = await Promise.all([
    Usuario.countDocuments(),
    Obra.countDocuments(),
  ]);

  if (usuariosCount === 0 && Array.isArray((data as any).usuarios)) {
    const usuarios = await Promise.all(
      (data as any).usuarios.map(async (u: any) => {
        const { seguranca, id, ...rest } = u;
        const passwordHash = await bcrypt.hash(seguranca.password, 10);
        return { ...rest, seguranca: { passwordHash } };
      })
    );
    await Usuario.insertMany(usuarios);
    console.log(`Seed: ${usuarios.length} usuários inseridos`);
  }

  if (obrasCount === 0 && Array.isArray((data as any).obras)) {
    const obras = (data as any).obras.map((o: any) => {
      const { id, ...rest } = o;
      return rest;
    });
    await Obra.insertMany(obras);
    console.log(`Seed: ${obras.length} obras inseridas`);
  }
}
