import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ProductosModule } from './productos/productos.module';
import { VentasModule } from './ventas/ventas.module';
import { CierresModule } from './cierres/cierres.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Inicializa el módulo de configuración de NestJS.
    // Carga las variables de entorno desde el archivo .env.
    // Al ser global, ConfigService queda disponible en toda la aplicación
    // sin necesidad de importarlo en cada módulo.
    MongooseModule.forRootAsync({
      // Inicializa la conexión con MongoDB usando Mongoose.
      // Se usa configuración ASÍNCRONA para poder leer valores dinámicos
      // (como variables de entorno) antes de establecer la conexión.

      inject: [ConfigService],
      // Inyecta el ConfigService dentro de la factory,
      // permitiendo acceder a las variables de entorno cargadas previamente.
      useFactory: (config: ConfigService) => ({
        // Función fábrica que se ejecuta al iniciar la aplicación.
        // Recibe ConfigService como dependencia y devuelve
        // el objeto de configuración que usará Mongoose.
        uri: config.getOrThrow('MONGO_URI'),
        // Obtiene la variable de entorno MONGO_URI desde el .env.
        // Si la variable no existe, la aplicación falla al iniciar,
        // evitando que el backend corra sin conexión válida a la base de datos.
      }),
    }),
    AuthModule,
    ProductosModule,
    VentasModule,
    CierresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
