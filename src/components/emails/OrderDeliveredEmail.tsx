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

interface OrderDeliveredEmailProps {
  orderNumber: string;
  customerName: string;
}

export const OrderDeliveredEmail = ({
  orderNumber = 'DS-1234',
  customerName = 'Juan',
}: OrderDeliveredEmailProps) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return (
    <Html>
      <Head />
      <Preview>🎉 ¡Tu pedido {orderNumber} ha sido entregado!</Preview>
      <Tailwind>
        <Body className="bg-[#f6f6f6] my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-[#e5e5e5] rounded-[16px] my-[40px] mx-auto max-w-[520px] overflow-hidden">
            {/* Header */}
            <Section className="bg-[#111111] px-[32px] py-[28px]">
              <Row>
                <Column>
                  <Text className="text-[13px] leading-[20px] text-white font-black tracking-[0.3em] uppercase m-0">
                    DEPORTIVOSTORE
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="text-[11px] leading-[20px] text-white/60 font-bold tracking-wide uppercase m-0">
                    Pedido Entregado
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Icon */}
            <Section className="px-[32px] pt-[36px] pb-[8px] text-center">
              <Text className="text-[40px] leading-[48px] m-0">🎉</Text>
              <Heading className="text-[#111111] text-[26px] font-black uppercase tracking-tight p-0 mt-[12px] mb-0 leading-[1.1]">
                ¡Pedido Entregado!
              </Heading>
              <Text className="text-[#888888] text-[13px] font-bold tracking-wide uppercase mt-[8px] mb-0">
                Pedido {orderNumber}
              </Text>
            </Section>

            {/* Body */}
            <Section className="px-[32px] pt-[20px]">
              <Text className="text-[#111111] text-[15px] leading-[26px] m-0">
                Hola <strong>{customerName}</strong>,
              </Text>
              <Text className="text-[#444444] text-[15px] leading-[26px] mt-[12px]">
                Tu pedido <strong>{orderNumber}</strong> ha sido entregado exitosamente. ¡Esperamos que disfrutes tu nueva equipación!
              </Text>
              <Text className="text-[#444444] text-[15px] leading-[26px] mt-[8px]">
                Si todo está en orden, nos encantaría que volvieras pronto. Y si tienes algún problema con tu pedido, no dudes en contactarnos.
              </Text>
            </Section>

            {/* CTA */}
            <Section className="text-center px-[32px] pt-[28px] pb-[32px]">
              <Button
                className="bg-[#111111] rounded-[8px] text-white text-[12px] font-black uppercase tracking-[0.2em] no-underline text-center px-[32px] py-[16px]"
                href={baseUrl}
              >
                Seguir Comprando
              </Button>
            </Section>

            {/* Footer */}
            <Hr className="border border-solid border-[#eaeaea] my-0 w-full" />
            <Section className="px-[32px] py-[24px]">
              <Text className="text-[#999999] text-[11px] leading-[18px] m-0 text-center">
                Gracias por tu compra. Tu opinión es muy importante para nosotros.
              </Text>
              <Text className="text-[#cccccc] text-[10px] leading-[18px] mt-[12px] text-center font-bold tracking-[0.2em] uppercase m-0">
                © {new Date().getFullYear()} DeportivoStore. Todos los derechos reservados.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderDeliveredEmail;
