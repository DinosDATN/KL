#!/usr/bin/env python3
"""
Test script để kiểm tra conversation history
"""

import requests
import json

# URL của Node.js API
NODE_API_URL = "http://localhost:3000/api/v1/chat-ai"

def test_conversation_history():
    """Test conversation history với một chuỗi câu hỏi"""
    
    print("=" * 60)
    print("TEST CONVERSATION HISTORY")
    print("=" * 60)
    
    # Câu hỏi 1: Không có history
    print("\n1. Câu hỏi đầu tiên (không có history):")
    print("   Question: 'Tên tôi là Nam'")
    
    response1 = requests.post(
        f"{NODE_API_URL}/ask-stream",
        json={
            "question": "Tên tôi là Nam"
        },
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Status: {response1.status_code}")
    if response1.status_code == 200:
        # Parse streaming response
        answer1 = ""
        for line in response1.text.split('\n'):
            if line.startswith('data: '):
                try:
                    data = json.loads(line[6:])
                    if data.get('type') == 'chunk':
                        answer1 += data.get('content', '')
                except:
                    pass
        print(f"   Answer: {answer1[:200]}...")
    
    # Câu hỏi 2: Có history từ câu 1
    print("\n2. Câu hỏi thứ hai (có history từ câu 1):")
    print("   Question: 'Tên tôi là gì?'")
    print("   History: 1 cặp messages")
    
    conversation_history = [
        {"role": "user", "content": "Tên tôi là Nam"},
        {"role": "assistant", "content": answer1}
    ]
    
    response2 = requests.post(
        f"{NODE_API_URL}/ask-stream",
        json={
            "question": "Tên tôi là gì?",
            "conversation_history": conversation_history
        },
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Status: {response2.status_code}")
    if response2.status_code == 200:
        answer2 = ""
        for line in response2.text.split('\n'):
            if line.startswith('data: '):
                try:
                    data = json.loads(line[6:])
                    if data.get('type') == 'chunk':
                        answer2 += data.get('content', '')
                except:
                    pass
        print(f"   Answer: {answer2[:200]}...")
        
        # Kiểm tra xem AI có nhớ tên không
        if "Nam" in answer2:
            print("   ✅ SUCCESS: AI nhớ được tên!")
        else:
            print("   ❌ FAILED: AI không nhớ được tên!")
    
    # Câu hỏi 3: Có history từ câu 1 và 2
    print("\n3. Câu hỏi thứ ba (có history từ câu 1 và 2):")
    print("   Question: 'Tôi thích học Python'")
    print("   History: 2 cặp messages")
    
    conversation_history.extend([
        {"role": "user", "content": "Tên tôi là gì?"},
        {"role": "assistant", "content": answer2}
    ])
    
    response3 = requests.post(
        f"{NODE_API_URL}/ask-stream",
        json={
            "question": "Tôi thích học Python",
            "conversation_history": conversation_history
        },
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Status: {response3.status_code}")
    if response3.status_code == 200:
        answer3 = ""
        for line in response3.text.split('\n'):
            if line.startswith('data: '):
                try:
                    data = json.loads(line[6:])
                    if data.get('type') == 'chunk':
                        answer3 += data.get('content', '')
                except:
                    pass
        print(f"   Answer: {answer3[:200]}...")
    
    # Câu hỏi 4: Test xem AI có nhớ cả tên và sở thích không
    print("\n4. Câu hỏi thứ tư (test memory):")
    print("   Question: 'Tóm tắt lại thông tin về tôi'")
    print("   History: 3 cặp messages")
    
    conversation_history.extend([
        {"role": "user", "content": "Tôi thích học Python"},
        {"role": "assistant", "content": answer3}
    ])
    
    response4 = requests.post(
        f"{NODE_API_URL}/ask-stream",
        json={
            "question": "Tóm tắt lại thông tin về tôi",
            "conversation_history": conversation_history
        },
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Status: {response4.status_code}")
    if response4.status_code == 200:
        answer4 = ""
        for line in response4.text.split('\n'):
            if line.startswith('data: '):
                try:
                    data = json.loads(line[6:])
                    if data.get('type') == 'chunk':
                        answer4 += data.get('content', '')
                except:
                    pass
        print(f"   Answer: {answer4}")
        
        # Kiểm tra xem AI có nhớ cả tên và sở thích không
        has_name = "Nam" in answer4
        has_interest = "Python" in answer4
        
        print("\n" + "=" * 60)
        print("KẾT QUẢ TEST:")
        print("=" * 60)
        print(f"   Nhớ tên (Nam): {'✅ YES' if has_name else '❌ NO'}")
        print(f"   Nhớ sở thích (Python): {'✅ YES' if has_interest else '❌ NO'}")
        
        if has_name and has_interest:
            print("\n   🎉 CONVERSATION HISTORY HOẠT ĐỘNG TỐT!")
        else:
            print("\n   ⚠️  CONVERSATION HISTORY CÓ VẤN ĐỀ!")
        print("=" * 60)

if __name__ == "__main__":
    try:
        test_conversation_history()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
