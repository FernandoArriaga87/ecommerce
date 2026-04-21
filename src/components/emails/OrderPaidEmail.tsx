import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Tailwind,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface OrderPaidEmailProps {
  orderNumber: string;
  customerName: string;
  total: string;
  subtotal?: string;
  shipping?: string;
  items?: Array<{
    name: string;
    size: string;
    quantity: number;
    price: string;
  }>;
}

export const OrderPaidEmail = ({
  orderNumber = 'DS-1234',
  customerName = 'Juan',
  total = '$1,899.00',
  subtotal = '$1,749.00',
  shipping = '$150.00',
  items = [
    { name: 'Jersey Barcelona 24/25', size: 'M', quantity: 1, price: '$899.00' },
    { name: 'Jersey Real Madrid 24/25', size: 'L', quantity: 1, price: '$850.00' },
  ],
}: OrderPaidEmailProps) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return (
    <Html>
      <Head />
      <Preview>✅ ¡Pago Confirmado! — Pedido {orderNumber}</Preview>
      <Tailwind>
        <Body className="bg-[#f6f6f6] my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-[#e5e5e5] rounded-[16px] my-[40px] mx-auto max-w-[520px] overflow-hidden">
            {/* Header */}
            <Section className="bg-[#111111] px-[32px] py-[28px]">
              <Row>
                <Column>
                  <Text className="text-[13px] leading-[20px] text-white font-black tracking-[0.3em] uppercase m-0">
                    AURASPORT
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="text-[11px] leading-[20px] text-white/60 font-bold tracking-wide uppercase m-0">
                    Confirmación de Pago
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Success Badge */}
            <Section className="px-[32px] pt-[36px] pb-[8px] text-center">
              <Text className="text-[40px] leading-[48px] m-0">✅</Text>
              <Heading className="text-[#111111] text-[26px] font-black uppercase tracking-tight p-0 mt-[12px] mb-0 leading-[1.1]">
                ¡Pago Confirmado!
              </Heading>
              <Text className="text-[#888888] text-[13px] font-bold tracking-wide uppercase mt-[8px] mb-0">
                Pedido {orderNumber}
              </Text>
            </Section>

            {/* Body */}
            <Section className="px-[32px] pt-[20px] pb-[8px]">
              <Text className="text-[#111111] text-[15px] leading-[26px] m-0">
                Hola <strong>{customerName}</strong>,
              </Text>
              <Text className="text-[#444444] text-[15px] leading-[26px] mt-[12px]">
                Tu pago ha sido procesado exitosamente. Nuestro equipo de almacén ya está preparando tu paquete con mucho cuidado.
              </Text>
              <Text className="text-[#444444] text-[15px] leading-[26px] mt-[8px]">
                Te enviaremos otro correo con el número de rastreo en cuanto tu pedido sea despachado.
              </Text>
            </Section>

            {/* Items */}
            {items && items.length > 0 && (
              <>
                <Hr className="border border-solid border-[#eaeaea] my-[24px] mx-[32px]" />
                <Section className="px-[32px]">
                  <Text className="text-[10px] font-black tracking-[0.25em] uppercase text-[#999999] m-0 mb-[16px]">
                    Resumen del pedido
                  </Text>
                  {items.map((item, i) => (
                    <Row key={i} className="mb-[12px]">
                      <Column>
                        <Text className="text-[#111111] text-[14px] font-bold leading-[20px] m-0">
                          {item.name}
                        </Text>
                        <Text className="text-[#999999] text-[12px] leading-[18px] m-0 mt-[2px]">
                          Talla {item.size} · Cantidad: {item.quantity}
                        </Text>
                      </Column>
                      <Column align="right">
                        <Text className="text-[#111111] text-[14px] font-black leading-[20px] m-0">
                          {item.price}
                        </Text>
                      </Column>
                    </Row>
                  ))}
                </Section>
              </>
            )}

            {/* Totals */}
            <Hr className="border border-solid border-[#eaeaea] my-[20px] mx-[32px]" />
            <Section className="px-[32px] pb-[8px]">
              <Row className="mb-[6px]">
                <Column>
                  <Text className="text-[#888888] text-[13px] leading-[20px] m-0">Subtotal</Text>
                </Column>
                <Column align="right">
                  <Text className="text-[#444444] text-[13px] font-bold leading-[20px] m-0">{subtotal}</Text>
                </Column>
              </Row>
              <Row className="mb-[6px]">
                <Column>
                  <Text className="text-[#888888] text-[13px] leading-[20px] m-0">Envío</Text>
                </Column>
                <Column align="right">
                  <Text className="text-[#444444] text-[13px] font-bold leading-[20px] m-0">{shipping}</Text>
                </Column>
              </Row>
              <Hr className="border border-solid border-[#eaeaea] my-[12px]" />
              <Row>
                <Column>
                  <Text className="text-[#111111] text-[15px] font-black leading-[24px] m-0 uppercase tracking-wide">Total</Text>
                </Column>
                <Column align="right">
                  <Text className="text-[#111111] text-[20px] font-black leading-[28px] m-0 tracking-tight">{total}</Text>
                </Column>
              </Row>
            </Section>

            {/* CTA */}
            <Section className="text-center px-[32px] pt-[24px] pb-[32px]">
              <Button
                className="bg-[#111111] rounded-[8px] text-white text-[12px] font-black uppercase tracking-[0.2em] no-underline text-center px-[32px] py-[16px]"
                href={`${baseUrl}/orders`}
              >
                Ver Estado del Pedido
              </Button>
            </Section>

            {/* Footer */}
            <Hr className="border border-solid border-[#eaeaea] my-0 w-full" />
            <Section className="px-[32px] py-[24px]">
              <Text className="text-[#999999] text-[11px] leading-[18px] m-0 text-center">
                Este es un correo de confirmación automático. Si tienes alguna duda, responde directamente a este correo.
              </Text>
              <Text className="text-[#cccccc] text-[10px] leading-[18px] mt-[12px] text-center font-bold tracking-[0.2em] uppercase m-0">
                © {new Date().getFullYear()} AuraSport · Pago seguro vía Stripe
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderPaidEmail;