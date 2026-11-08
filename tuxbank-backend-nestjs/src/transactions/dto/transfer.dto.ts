import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, {
    message: 'El número de cuenta destino debe tener 10 dígitos',
  })
  numeroCuentaDestino: string;

  @IsNumber()
  @IsInt()
  @Min(1, { message: 'El monto mínimo a transferir es 1' })
  monto: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  descripcion?: string;
}
