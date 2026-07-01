import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UserAccount } from '../entities/user-account.entity'
import { RegisterDto, LoginDto } from '../dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccount) private readonly userRepo: Repository<UserAccount>,
    private readonly jwt: JwtService,
  ) {}

  private sign(user: UserAccount) {
    const token = this.jwt.sign({
      sub: user.userId,
      id: user.userId,
      email: user.email,
      name: user.fullName,
      role: 'finance_manager',
    })
    return {
      token,
      user: { id: user.userId, email: user.email, name: user.fullName, role: 'finance_manager' },
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } })
    if (existing) throw new ConflictException('An account with this email already exists')

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = this.userRepo.create({
      tenantId: '1',
      companyId: '1',
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone ?? null,
      status: 'active',
    })
    const saved = await this.userRepo.save(user)
    return this.sign(saved)
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Invalid email or password')
    if (user.status !== 'active') throw new UnauthorizedException('This account is not active')

    const valid = await bcrypt.compare(dto.password, user.passwordHash).catch(() => false)
    if (!valid) throw new UnauthorizedException('Invalid email or password')

    return this.sign(user)
  }

  async me(userId: string) {
    const user = await this.userRepo.findOne({ where: { userId } })
    if (!user) throw new UnauthorizedException('User not found')
    return { id: user.userId, email: user.email, name: user.fullName, role: 'finance_manager' }
  }
}
